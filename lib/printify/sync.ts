import { createClient } from "@supabase/supabase-js"

import { printifyConfig } from "./client.ts"
import { defaultGarment, findGarment } from "./garments.ts"
import { type Placement } from "./print-areas.ts"
import { createDesignProduct } from "./products.ts"
import { FALLBACK_DESCRIPTION } from "../generation/compose.ts"

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

type MintableDesign = {
  id: string
  image_url: string
  print_ready_front_url: string | null
  vibe_id: string | null
  garment_slug: string | null
  featured_variant_id: number | null
  description: string | null
}

/** Shared by the first mint and the forced remint below: resolve the garment
 *  and vibe, create the Printify product, and store what it returns —
 *  including `placement` itself, so a design that arrived with no garment
 *  config on record ends up with the resolved value on the row rather than a
 *  null that no longer matches what got minted. */
async function mintAndStore(
  admin: ReturnType<typeof serviceClient>,
  design: MintableDesign,
  placement: Placement
): Promise<boolean> {
  const garment = design.garment_slug
    ? findGarment(design.garment_slug)
    : defaultGarment()

  if (!garment) return false

  const { data: vibe } = design.vibe_id
    ? await admin.from("vibes").select("name").eq("id", design.vibe_id).maybeSingle()
    : { data: null }

  const result = await createDesignProduct({
    designId: design.id,
    garment,
    title: `${vibe?.name ?? "Shirt Bazaar"} — 1 of 1`,
    // Composed alongside the title at generation time (lib/generation/compose.ts
    // composeListing). Null on designs generated before that column existed,
    // or when the composer call failed — same generic line either way.
    description: design.description ?? FALLBACK_DESCRIPTION,
    imageUrl: design.print_ready_front_url ?? design.image_url,
    placement,
    featuredVariantId: design.featured_variant_id ?? null,
  })

  if (!result) return false

  await admin
    .from("designs")
    .update({
      printify_product_id: result.productId,
      mockup_url: result.mockupUrl,
      back_mockup_url: result.backMockupUrl,
      placement,
    })
    .eq("id", design.id)

  return true
}

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
    .select(
      "id, image_url, print_ready_front_url, printify_product_id, vibe_id, garment_slug, featured_variant_id, placement, description"
    )
    .eq("id", designId)
    .maybeSingle()

  if (!design) return
  // Already minted. This is also why the garment config is frozen once a
  // product exists: re-minting would orphan the old one in the Printify shop.
  if (design.printify_product_id) return

  try {
    // A null placement is the backfill path — designs from before garment
    // choice existed, and the claim-path retry. Default garment, both sides
    // printed.
    await mintAndStore(admin, design, (design.placement as Placement | null) ?? "both")
  } catch (error) {
    // Logged, not thrown: an unhandled rejection in `after()` would surface as a
    // server error for a request that already succeeded.
    console.error(`[printify] sync failed for design ${designId}`, error)
  }
}

/** Force-remints a design's Printify product with a new placement, orphaning
 *  whatever product it already has — the one case where that trade-off (see
 *  above) is deliberately accepted rather than avoided. Printify doesn't bill
 *  for an unsold product, so the orphan costs nothing; this exists for the
 *  one-time move to real dual-side printing on designs minted before `both`
 *  was the default, not for routine use. */
export async function remintDesignProduct(
  designId: string,
  placement: Placement = "both"
): Promise<boolean> {
  if (!printifyConfig()) return false

  const admin = serviceClient()

  const { data: design } = await admin
    .from("designs")
    .select(
      "id, image_url, print_ready_front_url, vibe_id, garment_slug, featured_variant_id, description"
    )
    .eq("id", designId)
    .maybeSingle()

  if (!design) return false

  try {
    return await mintAndStore(admin, design, placement)
  } catch (error) {
    console.error(`[printify] remint failed for design ${designId}`, error)
    return false
  }
}
