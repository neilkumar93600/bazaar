/** Bolt's word that a payment landed.
 *
 *  This is the authoritative half of fulfilment: it arrives whether or not the
 *  buyer ever comes back to the site. The modal's success callback calls the
 *  same function for speed, and fulfilBoltTransaction is idempotent so the
 *  pair can't double-claim or double-email.
 *
 *  The raw body matters — request.text(), never request.json(). Signature
 *  verification hashes the exact bytes Bolt sent, and re-serialising parsed
 *  JSON changes them.
 */

import { fulfilBoltTransaction, type Fulfilment } from "@/lib/payments/fulfil";
import { verifyWebhook } from "@/lib/payments/bolt";

/** The events that mean money is committed. `pending` is a transaction still
 *  in fraud review and `rejected_*` is one that failed it — neither may claim
 *  a design, because a claim is permanent and those outcomes are not. */
const SETTLED_EVENTS = new Set(["payment", "auth", "capture"]);

export async function POST(request: Request) {
  const body = await request.text();

  // Without the signing secret every POST to this URL is an unauthenticated
  // request to hand somebody a design for free, so an unconfigured webhook is
  // a closed one — never a trusting one. verifyWebhook returns false when the
  // secret is unset, which is the same closed door.
  if (!(await verifyWebhook(body, request.headers.get("X-Bolt-Hmac-Sha256")))) {
    console.error("[bolt] bad webhook signature");
    return new Response("Invalid signature.", { status: 400 });
  }

  let event: { type?: unknown; reference?: unknown; data?: { reference?: unknown } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Malformed body.", { status: 400 });
  }

  const type = typeof event.type === "string" ? event.type : "";
  if (!SETTLED_EVENTS.has(type)) {
    // Acknowledged, not acted on. Returning an error for an event we simply
    // don't handle would have Bolt retry it forever.
    return Response.json({ received: true });
  }

  // Bolt puts the transaction reference at the top level; some payloads nest
  // it under `data`. Both are read because the signature already proved the
  // body authentic — and the reference is only a lookup key anyway, since
  // fulfilment re-reads the transaction from Bolt before claiming anything.
  const reference =
    typeof event.reference === "string"
      ? event.reference
      : typeof event.data?.reference === "string"
        ? event.data.reference
        : "";

  if (!reference) {
    console.error(`[bolt] ${type} webhook carries no transaction reference`);
    return new Response("No transaction reference.", { status: 400 });
  }

  let result: Fulfilment;
  try {
    result = await fulfilBoltTransaction(reference);
  } catch (error) {
    console.error(`[bolt] fulfilment threw for ${reference}`, error);
    return new Response("Fulfilment failed.", { status: 500 });
  }

  // 500 asks Bolt to retry, which is what we want for a transient failure —
  // but not for a refunded race, which is settled and will fail forever.
  if (!result.ok && !result.error.includes("refunded")) {
    console.error(`[bolt] fulfilment failed: ${result.error}`);
    return new Response(result.error, { status: 500 });
  }

  return Response.json({ received: true });
}
