// Canonical origin for metadataBase, sitemap, robots, and JSON-LD.
// Set NEXT_PUBLIC_SITE_URL in the deploy env; the fallback is only for local dev.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const siteName = "Shirt Bazaar";

/** The published inboxes. One place to change them, because they appear on
 *  /contact, /careers and all four legal pages — and a marketplace that lists
 *  an address nobody reads is worse than listing none.
 *
 *  ponytail: the legal pages still spell these out inline; fold them in when
 *  those get their real company details filled in. */
export const CONTACT_EMAILS = {
  support: "support@shirtbazaar.com",
  privacy: "privacy@shirtbazaar.com",
  legal: "legal@shirtbazaar.com",
} as const;
