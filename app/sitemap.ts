import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Only routes that render real content. /search stays out deliberately — its
// results are thin, infinite in combination and canonicalised to /shop.
const staticPaths: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/shop", priority: 0.9 },
  { path: "/faq", priority: 0.5 },
  { path: "/about", priority: 0.5 },
  { path: "/contact", priority: 0.3 },
  { path: "/careers", priority: 0.2 },
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
    .select("claimant_id, design_id")
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

  // Claimed designs only — matching the per-page robots directive in
  // /design/[id], which noindexes anything unclaimed. An unclaimed design is
  // transient (it's about to be claimed and change state), a claimed one is
  // permanent and has an owner to point at.
  for (const { design_id } of claims ?? []) {
    entries.push({
      url: `${siteUrl}/design/${design_id}`,
      lastModified: now,
      priority: 0.7,
    });
  }

  return entries;
}
