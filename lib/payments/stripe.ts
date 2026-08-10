/** The Stripe client, made once.
 *
 *  Lazy rather than module-level: STRIPE_SECRET_KEY is optional, and the whole
 *  app must still build and run without it — only a *priced* purchase needs
 *  Stripe, and this throws at that one call site rather than at import time.
 *
 *  lib/payments/checkout.ts is still the mock adapter, and still what garment
 *  orders charge through. Designs come here instead.
 */

import Stripe from "stripe"

import { envValue } from "@/lib/site"

let client: Stripe | null = null

export function stripeConfigured() {
  return Boolean(envValue("STRIPE_SECRET_KEY"))
}

export function stripe(): Stripe {
  const key = envValue("STRIPE_SECRET_KEY")
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — priced purchases are off.")
  }
  return (client ??= new Stripe(key))
}
