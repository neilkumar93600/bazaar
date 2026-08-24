import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deterministic hue (0-359) from a string, used to give each vibe column a
// stable low-opacity identity tint without storing a color in the database.
export function hueFromString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function formatCents(cents: number) {
  return CURRENCY_FORMAT.format(cents / 100)
}

/** Listing price for display. `null` is free — a deliberate choice by the
 *  maker, not a missing value, so it renders as a word rather than "$0.00". */
export function formatListingPrice(cents: number | null) {
  return cents === null ? "Free" : CURRENCY_FORMAT.format(cents / 100)
}

/** What to call a design.
 *
 *  `title` is written by the composer and backfilled for every older row, so it
 *  is effectively always there. `vibeName` is the last resort and used to be the
 *  first: heading every card and every <title> with it meant a grid of fourteen
 *  cards all reading "Riot", and fourteen product pages sharing one <title>.
 *
 *  The prompt is deliberately NOT in this chain. It is the recipe, and the
 *  recipe is never public — a card, a <title> or a receipt that falls back to it
 *  publishes the exact words that made the design. Callers still pass it; it is
 *  ignored.
 *
 *  `maxLength` clips for <title> and share cards, where CSS truncation can't
 *  reach. Cards pass nothing and clip with `truncate` instead. */
export function designLabel(
  design: { title?: string | null; vibeName?: string | null },
  maxLength?: number
) {
  const label = design.title?.trim() || design.vibeName?.trim() || "Untitled design"

  if (!maxLength || label.length <= maxLength) return label
  // Clip on a word boundary where there is one close to the limit, so titles
  // don't end mid-word.
  const clipped = label.slice(0, maxLength - 1)
  const lastSpace = clipped.lastIndexOf(" ")
  return `${(lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}
