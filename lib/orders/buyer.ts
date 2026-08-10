/** Who is buying a design, and where the receipt goes.
 *
 *  A design purchase ships nothing physical — there is no address to get
 *  wrong. The email is the whole delivery mechanism: the receipt and the
 *  artwork file both land there and nowhere else, so a typo here is a buyer
 *  who paid and got nothing. That is the one thing this file exists to catch.
 */

import { clean, isValidEmail } from "./address.ts"

export type Buyer = {
  name: string
  email: string
}

export type BuyerValidation =
  | { ok: true; buyer: Buyer }
  | { ok: false; error: string }

export function validateBuyer(raw: Record<string, unknown>): BuyerValidation {
  const buyer: Buyer = {
    name: clean(raw.name),
    email: clean(raw.email).toLowerCase(),
  }

  if (buyer.name === "") {
    return { ok: false, error: "Enter your name — it goes on the receipt." }
  }
  if (buyer.name.length > 120) {
    return { ok: false, error: "That name is too long." }
  }
  if (buyer.email === "") {
    return { ok: false, error: "Enter an email address." }
  }
  if (!isValidEmail(buyer.email)) {
    return { ok: false, error: "That email address doesn't look right." }
  }

  return { ok: true, buyer }
}
