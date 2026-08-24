"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { removeBackground } from "@/lib/generation/adapter"
import { validateListingPrice } from "@/lib/listing"
import { findGarment, sellableVariants } from "@/lib/printify/garments"
import { PLACEMENTS, type Placement } from "@/lib/printify/print-areas"
import { catalogVariants } from "@/lib/printify/products"
import { syncDesignProduct } from "@/lib/printify/sync"

export type ListingState = { error?: string }

export type GarmentConfig = {
  garmentSlug: string
  variantId: number
  placement: Placement
}

/** Puts a design in the bazaar, free or priced.
 *
 *  There is no ownership check here on purpose. `designs_update_creator_unclaimed`
 *  already restricts this UPDATE to the maker, and only while nobody owns it —
 *  a second check in application code is one more thing that can drift out of
 *  agreement with the policy. A caller who is not the maker updates zero rows
 *  and gets told so.
 */
export async function listDesign(
  designId: string,
  /** Null when the design already has a Printify product: the config is frozen
   *  at that point, because re-minting would orphan the existing product. */
  config: GarmentConfig | null,
  free: boolean,
  dollars: string
): Promise<ListingState> {
  const price = validateListingPrice(free, dollars)
  if (!price.ok) return { error: price.error }

  const update: Record<string, unknown> = {
    listed_at: new Date().toISOString(),
    price_cents: price.priceCents,
  }

  if (config) {
    // Validated against the live catalogue, never trusted: a variant id that
    // doesn't belong to the named garment would mint a product Printify
    // rejects, after the maker thinks they have listed.
    const garment = findGarment(config.garmentSlug)
    if (!garment) return { error: "Pick a garment." }

    // Sellable only — the same set the product will actually enable.
    const variants = sellableVariants(garment, await catalogVariants(garment))
    if (!variants.some((variant) => variant.id === config.variantId)) {
      return { error: "Pick a colour." }
    }
    if (!PLACEMENTS.includes(config.placement)) {
      return { error: "Pick where the print goes." }
    }

    update.garment_slug = garment.slug
    update.featured_variant_id = config.variantId
    update.placement = config.placement
  }

  const supabase = await createClient()

  // The config is written in the SAME update that sets listed_at, before
  // syncDesignProduct runs below — which is why that function needs no extra
  // parameter: it re-reads the row.
  const { data, error } = await supabase
    .from("designs")
    .update(update)
    .eq("id", designId)
    .select("id")

  if (error) return { error: "Could not list this design." }
  // Zero rows means RLS refused: not the maker, or somebody already claimed it.
  if (!data || data.length === 0) {
    return { error: "This design can't be listed any more." }
  }

  // Past the response: minting a Printify product is several network hops and
  // the design is already live without one — every surface falls back to the
  // drawn mockup. Swallows its own failures.
  after(async () => {
    await syncDesignProduct(designId)
  })

  revalidatePath("/dashboard/designs")
  revalidatePath(`/design/${designId}`)
  revalidatePath("/shop")
  revalidatePath("/")
  return {}
}

/** Pulls a design back out of the bazaar. `price_cents` is left as it was so
 *  the relist form can pre-fill it; an unlisted price is not a promise to
 *  anyone. */
export async function delistDesign(designId: string): Promise<ListingState> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("designs")
    .update({ listed_at: null })
    .eq("id", designId)
    .select("id")

  if (error) return { error: "Could not delist this design." }
  if (!data || data.length === 0) {
    return { error: "This design can't be delisted any more." }
  }

  revalidatePath("/dashboard/designs")
  revalidatePath(`/design/${designId}`)
  revalidatePath("/shop")
  revalidatePath("/")
  return {}
}

/** Cuts the flat background off a design the maker already has.
 *
 *  Generation no longer does this automatically. It used to, and it silently
 *  wrecked poster-style designs — the remover isolates a subject, so on a plate
 *  with a title and a line it kept the character and deleted the words. Making
 *  it a button means the maker sees the result and chooses.
 *
 *  Writes a new object rather than overwriting the old one. The previous file
 *  stays exactly where it is, so a bad cut costs a click to undo rather than
 *  the original artwork.
 */
export async function removeDesignBackground(
  designId: string
): Promise<ListingState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sign in to edit this design." }

  // RLS would also let a claimant edit a design they own, but cutting the
  // artwork is the maker's tool and only before somebody buys it: a buyer's
  // copy must not change under them after they have paid for it.
  const { data: design } = await supabase
    .from("designs")
    .select("id, image_url, original_image_url, creator_id, claimed_by")
    .eq("id", designId)
    .maybeSingle()

  if (!design) return { error: "Design not found." }
  if (design.creator_id !== user.id) return { error: "That isn't your design." }
  if (design.claimed_by) {
    return { error: "Somebody owns this one now — its artwork is fixed." }
  }

  let cut
  try {
    cut = await removeBackground(design.image_url)
  } catch (error) {
    console.error(`[designs] background removal failed for ${designId}`, error)
    return { error: "Couldn't cut the background out. Try again in a moment." }
  }

  const admin = createServiceClient()
  const path = `${designId}-cut-${Date.now()}.png`

  const { error: uploadError } = await admin.storage
    .from("designs")
    .upload(path, cut.bytes, { contentType: cut.contentType, upsert: true })

  if (uploadError) {
    console.error(`[designs] upload failed for ${designId}`, uploadError)
    return { error: "Couldn't save the cut-out. Try again in a moment." }
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("designs").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("designs")
    .update({
      image_url: publicUrl,
      // Recorded once only, so a second cut can't overwrite the true original
      // with an already-cut version.
      original_image_url: design.original_image_url ?? design.image_url,
    })
    .eq("id", designId)

  if (updateError) return { error: "Couldn't update the design." }

  revalidatePath("/dashboard/designs")
  revalidatePath(`/design/${designId}`)
  return {}
}

/** Puts the uncut artwork back. Free and instant — the reason the cut writes a
 *  new object instead of overwriting one. */
export async function restoreDesignBackground(
  designId: string
): Promise<ListingState> {
  const supabase = await createClient()

  const { data: design } = await supabase
    .from("designs")
    .select("id, original_image_url, claimed_by")
    .eq("id", designId)
    .maybeSingle()

  if (!design?.original_image_url) {
    return { error: "There's no original to go back to." }
  }
  if (design.claimed_by) {
    return { error: "Somebody owns this one now — its artwork is fixed." }
  }

  const { error } = await supabase
    .from("designs")
    .update({ image_url: design.original_image_url, original_image_url: null })
    .eq("id", designId)

  if (error) return { error: "Couldn't restore the original." }

  revalidatePath("/dashboard/designs")
  revalidatePath(`/design/${designId}`)
  return {}
}
