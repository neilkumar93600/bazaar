import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Only routes that render real content. /shop, /search, /auctions, /blog,
// /faq, /about, /contact, /careers, /design/[id] are all still <ComingSoon />
// stubs — submitting them would hand Google a dozen near-identical thin pages.
// Add each one back here the day it ships real content.
const staticPaths: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/terms", priority: 0.2 },
  { path: "/privacy", priority: 0.2 },
  { path: "/cookies", priority: 0.2 },
  { path: "/refund-policy", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticPaths.map(
    ({ path, priority }) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      priority,
    }),
  );

  // Quality gate: only storefronts with a claimed design get indexed. Empty
  // storefronts are thin pages and drag the whole domain's crawl budget.
  // ponytail: single unpaginated query; add chunking past ~40k profiles.
  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("claims")
    .select("claimant_id")
    .limit(45000);

  const claimantIds = [...new Set((claims ?? []).map((c) => c.claimant_id))];

  const { data: profiles } = claimantIds.length
    ? await supabase.from("profiles").select("handle").in("id", claimantIds)
    : { data: [] };

  for (const { handle } of profiles ?? []) {
    entries.push({
      url: `${siteUrl}/creator/${encodeURIComponent(handle)}`,
      lastModified: now,
      priority: 0.6,
    });
  }

  return entries;
}
