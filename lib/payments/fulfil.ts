/** Turns a paid Stripe Checkout session into an owned design.
 *
 *  Called from two places on purpose: the webhook (authoritative, arrives even
 *  if the buyer closes the tab) and the success page (instant, arrives even if
 *  webhooks aren't wired up in this environment). Whichever lands first does
 *  the work; the other one finds it done. Fulfilling twice would mean two
 *  claims and two receipts for one payment, so idempotency is the whole point
 *  of the shape below.
 */

import { resolveBuyerId } from "@/lib/purchase/buyer-account"
import { deliverDesignPurchase } from "@/lib/purchase/deliver"
import { stripe } from "@/lib/payments/stripe"
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

export async function fulfilCheckoutSession(
  sessionId: string
): Promise<Fulfilment> {
  const session = await stripe().checkout.sessions.retrieve(sessionId)

  // The only fact that matters. A session exists from the moment the buyer is
  // sent to Stripe, so its mere existence proves nothing.
  if (session.payment_status !== "paid") {
    return { ok: false, error: "That payment hasn't completed." }
  }

  const designId = session.metadata?.designId
  const buyerName = session.metadata?.buyerName ?? ""
  const buyerEmail = session.metadata?.buyerEmail ?? session.customer_email ?? ""
  const expectedCents = Number(session.metadata?.expectedCents)

  if (!designId || !buyerEmail) {
    console.error(`[fulfil] session ${sessionId} is missing metadata`)
    return { ok: false, error: "We couldn't match that payment to a design." }
  }

  // The payment intent, not the session id: it is what a refund, a dispute and
  // Stripe's own dashboard all key on, and orders.stripe_payment_intent_id is
  // named after it.
  const paymentRef =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id)

  const admin = createServiceClient()

  // No buyerId means the buyer was a guest, so the account is minted now —
  // after the money moved, not when they were sent to Stripe, which keeps an
  // abandoned checkout from leaving an empty account behind. Idempotent, so the
  // webhook and the success page racing each other resolve the same id.
  const buyerId =
    session.metadata?.buyerId ||
    (await resolveBuyerId({ name: buyerName, email: buyerEmail }, admin.auth.admin))

  if (!buyerId) {
    console.error(`[fulfil] no account for ${buyerEmail} on session ${sessionId}`)
    return { ok: false, error: "We couldn't set up an account for that email." }
  }

  // Already fulfilled — a webhook retry, a refreshed success page, or the
  // other path getting here first. Return the same answer, send no second
  // receipt.
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentRef)
    .maybeSingle()

  if (existing) {
    return { ok: true, handle: await handleFor(admin, buyerId) }
  }

  const { data, error } = await admin.rpc("claim_design_for", {
    p_buyer_id: buyerId,
    p_design_id: designId,
    p_expected_cents: Number.isFinite(expectedCents) ? expectedCents : null,
    p_payment_ref: paymentRef,
  })

  if (error || !data || data.length === 0) {
    // Either the two fulfilment paths raced (the row lock let exactly one
    // through) or somebody else claimed the design while this buyer was on
    // stripe.com. The first is fine. The second means money moved for
    // something the buyer will never receive, so it goes straight back.
    const { data: design } = await admin
      .from("designs")
      .select("claimed_by")
      .eq("id", designId)
      .maybeSingle()

    if (design?.claimed_by === buyerId) {
      return { ok: true, handle: await handleFor(admin, buyerId) }
    }

    console.error(`[fulfil] claim failed for session ${sessionId}`, error)

    try {
      await stripe().refunds.create({ payment_intent: paymentRef })
      return {
        ok: false,
        error: "Someone claimed this design first — your payment was refunded.",
      }
    } catch (refundError) {
      console.error(`[fulfil] refund failed for ${paymentRef}`, refundError)
      return {
        ok: false,
        error:
          "Someone claimed this design first. We couldn't refund automatically — contact support and we'll sort it out.",
      }
    }
  }

  const claim = data[0]

  await deliverDesignPurchase({
    designId,
    orderId: claim.order_id,
    buyer: { name: buyerName, email: buyerEmail },
    handle: claim.handle,
  })

  // Same backfill the free path runs: normally a no-op, because the product
  // was minted when the design was listed. Its own failures are swallowed —
  // the claim is done and a missing garment product is recoverable from the
  // row, whereas throwing here would have Stripe retry a finished purchase.
  try {
    await syncDesignProduct(designId)
  } catch (syncError) {
    console.error(`[fulfil] product sync failed for ${designId}`, syncError)
  }

  return { ok: true, handle: claim.handle }
}
