import { printifyConfig, printifyFetch, type PrintifyConfig } from "./client.ts"
import {
  parseVariant,
  sellableVariants,
  type Garment,
  type Variant,
} from "./garments.ts"
import { printAreas, type Placement } from "./print-areas.ts"

type UploadResponse = { id: string; file_name: string; preview_url: string }

type ProductImage = {
  src: string
  variant_ids: number[]
  position: string
  is_default?: boolean
}

type Product = { id: string; images?: ProductImage[] }

/** Mockups don't exist at the moment a product is created — Printify renders
 *  them right after. Poll a few times, then give up and leave `mockup_url`
 *  null; the drawn mockup covers the gap and a later sync can fill it in. */
const MOCKUP_POLL_ATTEMPTS = 5
const MOCKUP_POLL_DELAY_MS = 1_500

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The catalog is per blueprint/provider and changes about as often as Printify
 *  adds garments, so one process-lifetime fetch is plenty. Cached as the promise
 *  rather than the result, so concurrent listings share one request.
 *
 *  Keyed by blueprint/provider rather than being a single module-level promise:
 *  there is more than one garment now. */
const variantCache = new Map<string, Promise<Variant[]>>()

export function catalogVariants(garment: Garment): Promise<Variant[]> {
  const key = `${garment.blueprintId}/${garment.printProviderId}`
  const cached = variantCache.get(key)
  if (cached) return cached

  const config = printifyConfig()
  if (!config) return Promise.resolve([])

  const request = printifyFetch<{ variants: { id: number; title: string }[] }>(
    config,
    `/v1/catalog/blueprints/${garment.blueprintId}/print_providers/${garment.printProviderId}/variants.json`
  )
    .then((data) => (data.variants ?? []).map(parseVariant))
    .catch((error) => {
      // A failed lookup must not poison the cache for the life of the process.
      variantCache.delete(key)
      throw error
    })

  variantCache.set(key, request)
  return request
}

/** Printify pulls the file itself, so the image has to be on a URL it can
 *  reach — a Supabase public object or any other public host. */
async function uploadImage(
  config: PrintifyConfig,
  fileName: string,
  url: string
) {
  const upload = await printifyFetch<UploadResponse>(
    config,
    "/v1/uploads/images.json",
    { method: "POST", body: { file_name: fileName, url } }
  )
  return upload.id
}

/** Picks the render to show in the bazaar out of the ~66 Printify generates per
 *  product (every camera angle × every enabled colour).
 *
 *  The maker's chosen colour wins, which is the entire point of the setting —
 *  each image carries the `variant_ids` it depicts, so the featured variant
 *  finds its own render.
 *
 *  After that: `position` is not the discriminator it looks like. A Bella+Canvas
 *  3001 comes back with every image marked `"other"`, and the view is encoded in
 *  the src as `?camera_label=front-2`. So trust `is_default` first — Printify
 *  sets it on the image it treats as the primary — then fall back to the camera
 *  label, then to `position`, then to whatever came first. */
function pickMockup(
  product: Product,
  featuredVariantId: number | null
): string | null {
  const images = product.images ?? []
  const forVariant = featuredVariantId
    ? images.filter((image) => image.variant_ids.includes(featuredVariantId))
    : []

  const chosen =
    forVariant.find((image) => image.src.includes("camera_label=front")) ??
    forVariant.find((image) => image.is_default) ??
    forVariant[0] ??
    // No featured variant (a design from before garment config existed), or
    // Printify rendered nothing for it.
    images.find((image) => image.is_default) ??
    images.find((image) => image.src.includes("camera_label=front")) ??
    images.find((image) => image.position === "front") ??
    images[0] ??
    null

  return chosen?.src ?? null
}

export type PrintifySyncResult = { productId: string; mockupUrl: string | null }

/** Creates the Printify product for a design and returns its id plus the first
 *  mockup Printify renders for it.
 *
 *  The product is created but never published: this app is the storefront, so
 *  Printify only has to hold the item for fulfilment. Publishing would push it
 *  to a connected sales channel, which is not what a 1-of-1 marketplace wants.
 *
 *  Returns null when Printify isn't configured — the caller treats that as
 *  "no product", not as a failure. */
export async function createDesignProduct({
  designId,
  garment,
  title,
  description,
  imageUrl,
  placement,
  featuredVariantId,
}: {
  designId: string
  garment: Garment
  title: string
  description: string
  /** Must be publicly reachable: Printify fetches it server-side. */
  imageUrl: string
  placement: Placement
  /** A representative variant of the maker's colour. Decides which of the ~66
   *  renders becomes the hero mockup; it is not what anyone buys. */
  featuredVariantId: number | null
}): Promise<PrintifySyncResult | null> {
  const config = printifyConfig()
  if (!config) return null

  const [imageId, variants] = await Promise.all([
    uploadImage(config, `${designId}.png`, imageUrl),
    catalogVariants(garment),
  ])

  // The garment's curated colours, capped at Printify's 100-variant ceiling.
  // Enabling the whole catalogue (995 variants on blueprint 12) fails with
  // `8251 Too many variants enabled` — and because syncDesignProduct swallows
  // its errors, the symptom is silently missing products.
  const variantIds = sellableVariants(garment, variants).map((v) => v.id)

  if (variantIds.length === 0) {
    throw new Error(
      `Printify blueprint ${garment.blueprintId} / provider ${garment.printProviderId} returned no sellable variants`
    )
  }

  const created = await printifyFetch<Product>(
    config,
    `/v1/shops/${config.shopId}/products.json`,
    {
      method: "POST",
      body: {
        title,
        description,
        blueprint_id: garment.blueprintId,
        print_provider_id: garment.printProviderId,
        variants: variantIds.map((id) => ({
          id,
          price: garment.priceCents,
          is_enabled: true,
        })),
        print_areas: printAreas(imageId, variantIds, placement),
      },
    }
  )

  let mockupUrl = pickMockup(created, featuredVariantId)

  for (let attempt = 0; attempt < MOCKUP_POLL_ATTEMPTS && !mockupUrl; attempt++) {
    await sleep(MOCKUP_POLL_DELAY_MS)
    const product = await printifyFetch<Product>(
      config,
      `/v1/shops/${config.shopId}/products/${created.id}.json`
    )
    mockupUrl = pickMockup(product, featuredVariantId)
  }

  return { productId: created.id, mockupUrl }
}

/** Re-reads a product's mockups. For designs whose product exists but whose
 *  render hadn't finished within the claim's budget. */
export async function fetchProductMockup(
  productId: string,
  featuredVariantId: number | null = null
): Promise<string | null> {
  const config = printifyConfig()
  if (!config) return null

  const product = await printifyFetch<Product>(
    config,
    `/v1/shops/${config.shopId}/products/${productId}.json`
  )
  return pickMockup(product, featuredVariantId)
}
