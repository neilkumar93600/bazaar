/** Drawn-preview colours, derived from Printify's colour names.
 *
 *  Deliberately import-free: `ListingForm` and `ShirtMockup` are client
 *  components and need these to paint swatches and garments, while `garments.ts`
 *  next door calls `printifyConfig()` and reads PRINTIFY_API_TOKEN. Keeping the
 *  colour maths separate is what stops that token's module graph reaching the
 *  browser.
 *
 *  Approximate on purpose — this drives the drawn preview only, and Printify's
 *  real product photo replaces it once the product is minted.
 */

export type GarmentTone = {
  id: string
  body: string
  shade: string
  deep: string
  seam: string
}

/** Printify colour names to a base hex. Anything missing falls back to the
 *  hashed tone in ShirtMockup, so a garment added later never renders a hole. */
const COLOUR_HEX: Record<string, string> = {
  black: "#101014",
  white: "#f4f3ef",
  navy: "#1f2a44",
  "sport grey": "#b3b3ae",
  "heather grey": "#a8a9ad",
  "dark heather": "#4a4a4d",
  "dark grey heather": "#3f3f43",
  charcoal: "#36363a",
  ash: "#d6d5d0",
  maroon: "#5c1f2a",
  red: "#b3242c",
  royal: "#1f3f8f",
  "royal blue": "#1f3f8f",
  "light blue": "#a9c6e0",
  forest: "#1e3a2b",
  "forest green": "#1e3a2b",
  "irish green": "#14803c",
  "military green": "#4a4a35",
  sand: "#d8c9a8",
  natural: "#e6dfcf",
  gold: "#d9a520",
  orange: "#d4632a",
  purple: "#4b2a63",
  "light pink": "#e8c2cf",
}

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function mix(hex: string, toward: string, amount: number): string {
  const from = channels(hex)
  const to = channels(toward)
  const blended = from.map((value, index) =>
    Math.round(value + (to[index] - value) * amount)
  )
  return `#${blended.map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Four channels derived from one hex rather than hand-authored per colour.
 *
 *  Shade and deep always darken. The seam darkens on a light garment and
 *  *lightens* on a dark one — darkening charcoal further just makes it vanish,
 *  which is exactly what the hand-tuned charcoal tone in ShirtMockup does. */
function toneFromHex(id: string, hex: string): GarmentTone {
  const dark = luminance(hex) < 0.3
  return {
    id,
    body: hex,
    shade: mix(hex, "#000000", 0.18),
    deep: mix(hex, "#000000", 0.34),
    seam: dark ? mix(hex, "#ffffff", 0.14) : mix(hex, "#000000", 0.12),
  }
}

/** Null for an unknown colour — the caller falls back to the hashed tone rather
 *  than rendering a hole. */
export function toneForColourName(name: string): GarmentTone | null {
  const key = name.trim().replace(/\s+/g, " ").toLowerCase()
  const hex = COLOUR_HEX[key]
  if (!hex) return null
  return toneFromHex(key.replace(/\s+/g, "-"), hex)
}
