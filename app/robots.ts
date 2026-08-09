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

        "/onboarding",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-otp",
        "/design/", // ComingSoon stub — drop this line once the claim flow ships
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
