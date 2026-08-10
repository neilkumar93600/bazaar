/** An env var that is actually set to something.
 *
 *  `??` is not enough. A key left blank in .env — or, more often, a key whose
 *  line is `KEY=   # what it's for`, which parses to a blank or to the comment
 *  itself — is present as far as `??` is concerned. That took the whole site
 *  down once: a blank NEXT_PUBLIC_SITE_URL reached `new URL()` in the root
 *  layout's metadataBase and threw on every route.
 *
 *  Unset, blank and commented all mean the same thing here: not configured. */
export function envValue(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  return raw && !raw.startsWith("#") ? raw : undefined;
}

// Canonical origin for metadataBase, sitemap, robots, and JSON-LD.
// Set NEXT_PUBLIC_SITE_URL in the deploy env; the fallback is only for local dev.
export const siteUrl = (
  envValue("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
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
