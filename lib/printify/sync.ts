import { createClient } from "@supabase/supabase-js"

import { printifyConfig } from "./client.ts"
import { createDesignProduct } from "./products.ts"

/** Service-role client. This runs after the user's response has been sent, with
 *  no session attached, and `designs` has no client-side update policy for these
 *  columns. Same pattern as the generation worker in app/api/generate/route.ts. */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

/** What the Printify product's variants are priced at when the design itself
 *  carries no price (the maker listed it free).
 *
 *  These are different prices wearing the same name: `designs.price_cents` is
 *  what a claimer pays for *ownership*; this is what a buyer pays for a
 *  *garment*. Sub-project D gives the garment its own price and this constant
 *  goes away. Until then, free ownership must not mean a free t-shirt.
 *
 *  ponytail: one constant, not a config table — there is exactly one garment
 *  price in the system today. */
const FALLBACK_GARMENT_PRICE_CENTS = 2900

/** Mints the Printify product for a design and stores the id and mockup on the
 *  row.
 *
 *  Runs at listing, not at generation: a design that is never listed never
 *  needs a product, and minting one costs an API call per design. Printify
 *  bills on order, not on product creation, so a listed-but-unsold product
 *  costs nothing. The claim path calls this too, which is a no-op once a
 *  product exists and backfills anything listed while Printify was
 *  unconfigured.
 *
 *  Called from `after()`, so it must swallow its own failures: the design row is
 *  already committed. A design with no Printify product still renders via the
 *  drawn mockup — it just can't be fulfilled until this is re-run.
 *
 *  Printing uses `print_ready_front_url` when the generator has produced one,
 *  falling back to the display image. Printify fetches the URL itself, so it has
 *  to be publicly reachable — a signed or private object will fail here. */
export async function syncDesignProduct(designId: string): Promise<void> {
  if (!printifyConfig()) return

  const admin = serviceClient()

  const { data: design } = await admin
    .from("designs")
    .select("id, image_url, print_ready_front_url, price_cents, printify_product_id, vibe_id")
    .eq("id", designId)
    .maybeSingle()

  if (!design) return
  // Already minted. Claims are one-way, so this is only reachable via a retry.
  if (design.printify_product_id) return

  const { data: vibe } = design.vibe_id
    ? await admin.from("vibes").select("name").eq("id", design.vibe_id).maybeSingle()
    : { data: null }

  try {
    const result = await createDesignProduct({
      designId: design.id,
      title: `${vibe?.name ?? "Shirt Bazaar"} — 1 of 1`,
      description:
        "A one-of-a-kind AI design, claimed by a single owner and never reprinted for anyone else.",
      imageUrl: design.print_ready_front_url ?? design.image_url,
      priceCents: design.price_cents ?? FALLBACK_GARMENT_PRICE_CENTS,
    })

    if (!result) return

    await admin
      .from("designs")
      .update({
        printify_product_id: result.productId,
        mockup_url: result.mockupUrl,
      })
      .eq("id", design.id)
  } catch (error) {
    // Logged, not thrown: an unhandled rejection in `after()` would surface as a
    // server error for a request that already succeeded.
    console.error(`[printify] sync failed for design ${designId}`, error)
  }
}
