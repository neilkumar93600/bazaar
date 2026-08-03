export const QUALITY_TIERS = [
  {
    value: "everyday",
    label: "Everyday",
    blurb: "Soft cotton blend, everyday wear.",
    deltaCents: 0,
  },
  {
    value: "premium",
    label: "Premium",
    blurb: "Heavyweight fabric, richer print detail.",
    deltaCents: 1000,
  },
] as const

export type QualityTier = (typeof QUALITY_TIERS)[number]["value"]

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const
export type Size = (typeof SIZES)[number]

export const BOTH_SIDES_DELTA_CENTS = 800

export function computeTotalCents(
  basePriceCents: number,
  qualityTier: QualityTier,
  placementFront: boolean,
  placementBack: boolean
): number {
  const tier = QUALITY_TIERS.find((t) => t.value === qualityTier)
  const tierDelta = tier?.deltaCents ?? 0
  const placementDelta = placementFront && placementBack ? BOTH_SIDES_DELTA_CENTS : 0
  return basePriceCents + tierDelta + placementDelta
}
