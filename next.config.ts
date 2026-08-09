import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
      // Printify mockup renders. Two hosts: `images.printify.com` serves the
      // generated product photos, `images-api.printify.com` the catalog blanks.
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "images-api.printify.com" },
    ],
  },
}

export default nextConfig
