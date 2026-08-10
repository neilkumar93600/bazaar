/** Shipping address validation.
 *
 *  Printify rejects an order it has already accepted if the address is wrong,
 *  and that rejection surfaces long after checkout — so everything catchable is
 *  caught here, at the boundary, before any money or manufacturing moves.
 */

export type ShippingAddress = {
  firstName: string
  lastName: string
  email: string
  phone: string
  /** ISO-3166 alpha-2, uppercase. */
  country: string
  region: string
  address1: string
  address2: string
  city: string
  zip: string
}

/** Printify rejects these three without a state or province. Every other
 *  country treats region as optional. */
export const REGION_REQUIRED_COUNTRIES = ["US", "CA", "AU"]

export type AddressValidation =
  | { ok: true; address: ShippingAddress }
  | { ok: false; error: string }

/** Exported because buyer.ts validates the same two things the same way. */
export const clean = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""

/** Not RFC-complete on purpose — enough to catch a typo, not enough to reject
 *  a real address someone actually owns. */
export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export function validateAddress(raw: Record<string, unknown>): AddressValidation {
  const address: ShippingAddress = {
    firstName: clean(raw.firstName),
    lastName: clean(raw.lastName),
    email: clean(raw.email).toLowerCase(),
    phone: clean(raw.phone),
    country: clean(raw.country).toUpperCase(),
    region: clean(raw.region),
    address1: clean(raw.address1),
    address2: clean(raw.address2),
    city: clean(raw.city),
    zip: clean(raw.zip),
  }

  const required: [keyof ShippingAddress, string][] = [
    ["firstName", "Enter a first name."],
    ["lastName", "Enter a last name."],
    ["email", "Enter an email address."],
    ["phone", "Enter a phone number — carriers need one."],
    ["country", "Pick a country."],
    ["address1", "Enter a street address."],
    ["city", "Enter a city."],
    ["zip", "Enter a postal code."],
  ]

  for (const [field, error] of required) {
    if (address[field] === "") return { ok: false, error }
  }

  // Two letters, because that is what Printify's `country` field takes.
  if (!/^[A-Z]{2}$/.test(address.country)) {
    return { ok: false, error: "Use a two-letter country code, like US or GB." }
  }

  if (!isValidEmail(address.email)) {
    return { ok: false, error: "That email address doesn't look right." }
  }

  if (REGION_REQUIRED_COUNTRIES.includes(address.country) && address.region === "") {
    return { ok: false, error: "Enter a state or province." }
  }

  return { ok: true, address }
}
