/** Stripe's word that a payment landed.
 *
 *  This is the authoritative half of fulfilment: it arrives whether or not the
 *  buyer ever comes back to the site. The success page calls the same function
 *  for speed, and fulfilCheckoutSession is idempotent so the pair can't
 *  double-claim or double-email.
 *
 *  The raw body matters — request.text(), never request.json(). Signature
 *  verification hashes the exact bytes Stripe sent, and re-serialising parsed
 *  JSON changes them.
 */

import { fulfilCheckoutSession } from "@/lib/payments/fulfil";
import { stripe } from "@/lib/payments/stripe";
import { envValue } from "@/lib/site";

export async function POST(request: Request) {
  const secret = envValue("STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");

  // Without the secret every POST to this URL is an unauthenticated request to
  // hand somebody a design for free, so an unconfigured webhook is a closed
  // one — never a trusting one.
  if (!secret || !signature) {
    return new Response("Webhook not configured.", { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, signature, secret);
  } catch (error) {
    console.error("[stripe] bad webhook signature", error);
    return new Response("Invalid signature.", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const result = await fulfilCheckoutSession(event.data.object.id);

    // 500 asks Stripe to retry, which is what we want for a transient failure
    // — but not for a refunded race, which is settled and will fail forever.
    if (!result.ok && !result.error.includes("refunded")) {
      console.error(`[stripe] fulfilment failed: ${result.error}`);
      return new Response(result.error, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
