/** Turns a settled Bolt transaction into an owned design.
 *
 *  Called from two places on purpose: the webhook (authoritative, arrives even
 *  if the buyer closes the tab) and the browser's success callback (instant,
 *  arrives even if webhooks aren't wired up in this environment). Whichever
 *  lands first does the work; the other one finds it done. Fulfilling twice
 *  would mean two claims and two receipts for one payment, so idempotency is
 *  the whole point of the shape below.
 *
 *  Nothing here trusts its input beyond the reference. The transaction is
 *  re-read from Bolt, the buyer's details come from our own checkout_intents
 *  row, and the price comes from the designs table inside the claim's row
 *  lock. A caller who invents a reference gets nothing.
 */

import { creditTransaction, getTransaction, isSettled } from "@/lib/payments/bolt"
import { resolveBuyerId } from "@/lib/purchase/buyer-account"
import { deliverDesignPurchase } from "@/lib/purchase/deliver"
import { syncDesignProduct } from "@/lib/printify/sync"
import { createServiceClient } from "@/lib/supabase/server"

export type Fulfilment =
  | { ok: true; handle: string | null }
  | { ok: false; error: string }

type Admin = ReturnType<typeof createServiceClient>

async function handleFor(admin: Admin, buyerId: string) {
  const { data } = await admin
    .from("profiles")
    .select("handle")
    .eq("id", buyerId)
    .maybeSingle()
  return data?.handle ?? null
}

export async function fulfilBoltTransaction(
  reference: string
): Promise<Fulfilment> {
  const transaction = await getTransaction(reference)

  // The only fact that matters. A transaction exists from the moment the
  // shopper opens the modal, so its mere existence proves nothing.
  if (!isSettled(transaction.status)) {
    return { ok: false, error: "That payment hasn't completed." }
  }

  if (!transaction.orderReference) {
    console.error(`[fulfil] transaction ${reference} carries no order reference`)
    return { ok: false, error: "We couldn't match that payment to a design." }
  }

  const admin = createServiceClient()

  // Everything we knew about the buyer when we sent them to Bolt. Kept here
  // rather than in the processor's metadata, so a name and an email never
  // leave our own database to come back as a string map.
  const { data: intent } = await admin
    .from("checkout_intents")
    .select("design_id, buyer_id, buyer_name, buyer_email, expected_cents")
    .eq("order_reference", transaction.orderReference)
    .maybeSingle()

  if (!intent) {
    console.error(`[fulfil] no checkout intent for ${transaction.orderReference}`)
    return { ok: false, error: "We couldn't match that payment to a design." }
  }

  // Bolt charged something other than what the buyer was shown. Never claim on
  // a mismatch — it means the cart and the row disagree, and the design row is
  // the one that decides what this costs.
  if (
    transaction.amountCents !== null &&
    transaction.amountCents !== intent.expected_cents
  ) {
    console.error(
      `[fulfil] amount mismatch on ${reference}: charged ${transaction.amountCents}, expected ${intent.expected_cents}`
    )
    return { ok: false, error: "That payment doesn't match the price. Contact support." }
  }

  // Already fulfilled — a webhook retry, a refreshed success page, or the
  // other path getting here first. Return the same answer, send no second
  // receipt. orders.payment_ref is uniquely indexed, so the claim below still
  // cannot double-insert if two of these run at once.
  const { data: existing } = await admin
    .from("orders")
    .select("buyer_id")
    .eq("payment_ref", transaction.reference)
    .maybeSingle()

  if (existing) {
    return { ok: true, handle: await handleFor(admin, existing.buyer_id) }
  }

  // No buyer_id means the buyer was a guest, so the account is minted now —
  // after the money moved, not when they opened the modal, which keeps an
  // abandoned checkout from leaving an empty account behind. Idempotent, so
  // the webhook and the success callback racing resolve the same id.
  const buyerId =
    intent.buyer_id ??
    (await resolveBuyerId(
      { name: intent.buyer_name, email: intent.buyer_email },
      admin.auth.admin
    ))

  if (!buyerId) {
    console.error(`[fulfil] no account for ${intent.buyer_email} on ${reference}`)
    return { ok: false, error: "We couldn't set up an account for that email." }
  }

  const { data, error } = await admin.rpc("claim_design_for", {
    p_buyer_id: buyerId,
    p_design_id: intent.design_id,
    p_expected_cents: intent.expected_cents,
    p_payment_ref: transaction.reference,
  })

  if (error || !data || data.length === 0) {
    // Either the two fulfilment paths raced (the row lock let exactly one
    // through) or somebody else claimed the design while this buyer was in the
    // modal. The first is fine. The second means money moved for something the
    // buyer will never receive, so it goes straight back.
    const { data: design } = await admin
      .from("designs")
      .select("claimed_by")
      .eq("id", intent.design_id)
      .maybeSingle()

    if (design?.claimed_by === buyerId) {
      return { ok: true, handle: await handleFor(admin, buyerId) }
    }

    console.error(`[fulfil] claim failed for transaction ${reference}`, error)

    try {
      await creditTransaction(transaction.reference, intent.expected_cents)
      return {
        ok: false,
        error: "Someone claimed this design first — your payment was refunded.",
      }
    } catch (refundError) {
      console.error(`[fulfil] refund failed for ${reference}`, refundError)
      return {
        ok: false,
        error:
          "Someone claimed this design first. We couldn't refund automatically — contact support and we'll sort it out.",
      }
    }
  }

  const claim = data[0]

  await deliverDesignPurchase({
    designId: intent.design_id,
    orderId: claim.order_id,
    buyer: { name: intent.buyer_name, email: intent.buyer_email },
    handle: claim.handle,
  })

  // Same backfill the free path runs: normally a no-op, because the product
  // was minted when the design was listed. Its own failures are swallowed —
  // the claim is done and a missing garment product is recoverable from the
  // row, whereas throwing here would have Bolt retry a finished purchase.
  try {
    await syncDesignProduct(intent.design_id)
  } catch (syncError) {
    console.error(`[fulfil] product sync failed for ${intent.design_id}`, syncError)
  }

  return { ok: true, handle: claim.handle }
}
