import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",

        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-otp",

        // Not /design/ — those are the product pages, and each one sets its own
        // robots directive (claimed indexes, unclaimed doesn't). Blocking the
        // prefix here would stop Google reading that directive at all.
        //
        // /search is crawlable but self-noindexes; leaving it allowed lets the
        // canonical to /shop be seen.
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
