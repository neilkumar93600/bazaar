// Canonical origin for metadataBase, sitemap, robots, and JSON-LD.
// Set NEXT_PUBLIC_SITE_URL in the deploy env; the fallback is only for local dev.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const siteName = "Shirt Bazaar";
