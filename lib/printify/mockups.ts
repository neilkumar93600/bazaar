/** Printify's product photo, re-pointed at another garment colour.
 *
 *  A mockup URL is a template, not an opaque blob:
 *
 *      https://images-api.printify.com/mockup/{productId}/{variantId}/{imageId}/{slug}.jpg?camera_label=front-2
 *
 *  The variant segment picks the colour, the image segment picks the camera
 *  angle, and the query repeats the angle. So the same shot in another colour
 *  is the same URL with one segment swapped — no API call, no extra column, and
 *  the camera the design was photographed from is preserved, which matters for
 *  a back print.
 *
 *  Verified against a live product: any variant id belonging to the colour
 *  resolves (Printify groups the sizes), and an id that belongs to no variant
 *  400s rather than silently serving the wrong shirt.
 *
 *  Deliberately import-free, like ./tones.ts next door: the gallery is a client
 *  component, and `garments.ts` reads PRINTIFY_API_TOKEN.
 */

export type ColourMockup = { colour: string; variantId: number; url: string }

/** `mockup`, productId, variantId, imageId, slug — five path segments after the
 *  origin. Anything else is a URL shape this function does not understand, and
 *  guessing at it would serve a 404 into an <img>; better to drop the colour
 *  than to show a broken photo. */
const SEGMENTS = 5

/** Printify's image CDN. Checked so a `mockup_url` from anywhere else is
 *  refused rather than having its third path segment rewritten on spec. */
const HOST = "printify.com"

/** The same render in another colour, or null if the URL isn't a Printify
 *  mockup template. */
export function mockupInColour(mockupUrl: string, variantId: number): string | null {
  let url: URL
  try {
    url = new URL(mockupUrl)
  } catch {
    return null
  }

  if (url.hostname !== HOST && !url.hostname.endsWith(`.${HOST}`)) return null

  // ["", "mockup", productId, variantId, imageId, slug.jpg]
  const parts = url.pathname.split("/")
  if (parts.length !== SEGMENTS + 1 || parts[1] !== "mockup") return null

  parts[3] = String(variantId)
  url.pathname = parts.join("/")

  return url.toString()
}

/** One real product photo per colour the garment is sold in.
 *
 *  Colours that can't be re-pointed are dropped rather than falling back to the
 *  original photo, which would put the same shirt under two different swatches.
 */
export function colourMockups(
  mockupUrl: string | null,
  colours: { colour: string; variantId: number }[]
): ColourMockup[] {
  if (!mockupUrl) return []

  const out: ColourMockup[] = []
  for (const { colour, variantId } of colours) {
    const url = mockupInColour(mockupUrl, variantId)
    if (url) out.push({ colour, variantId, url })
  }
  return out
}
