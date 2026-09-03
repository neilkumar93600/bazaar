import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // A CSP is deliberately not set here: Bolt's embedded checkout modal and the
  // Google/Apple OAuth redirects each need script/frame sources verified live
  // against the real integrations before locking them down, and getting that
  // wrong silently breaks payment — the headers below are the ones safe to
  // ship without that verification. See docs/SECURITY.md.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
      // Printify mockup renders. Two hosts: `images.printify.com` serves the
      // generated product photos, `images-api.printify.com` the catalog blanks.
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "images-api.printify.com" },
      // Supabase Storage host
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
}

export default nextConfig
