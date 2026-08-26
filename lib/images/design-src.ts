/** The URL the browser is given for a design's flat artwork.
 *
 *  Never the storage URL. That one is the full print-resolution original, and
 *  putting it in the markup hands the product away to anyone who opens the
 *  page source. `/api/design-image/[id]` serves the same artwork watermarked
 *  and capped for everyone except the owner and the maker.
 *
 *  Keep every client-facing mapping going through here — a single call site
 *  that still returns `d.image_url` reopens the hole for the whole catalogue.
 */
export function designImageSrc(id: string): string {
  return `/api/design-image/${id}`;
}
