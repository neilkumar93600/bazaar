/** Whether this design can be ordered as a garment at all.
 *
 *  Pure, and mirrored by the server action's own re-read of the row: the action
 *  is the boundary, this is where the rule is written down and checked.
 */

export type OrderableDesign = {
  claimedBy: string | null
  printifyProductId: string | null
}

export type OrderCheck = { ok: true } | { ok: false; error: string }

export function orderEligibility(
  design: OrderableDesign,
  variantId: number,
  catalogueVariantIds: number[]
): OrderCheck {
  // Claiming is what the bazaar sells. An unclaimed design also has no owner,
  // so a royalty would have nowhere to go.
  if (design.claimedBy === null) {
    return { ok: false, error: "This design hasn't been claimed yet." }
  }
  if (!design.printifyProductId) {
    return { ok: false, error: "This design isn't ready to order yet." }
  }
  // Printify accepts an order carrying a variant from another blueprint and
  // rejects it later, after the buyer believes they have paid.
  if (!catalogueVariantIds.includes(variantId)) {
    return { ok: false, error: "Pick a size." }
  }
  return { ok: true }
}
