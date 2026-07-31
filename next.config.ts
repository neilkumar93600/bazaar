import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Seed/placeholder imagery until the image-gen adapter is wired up.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
}

export default nextConfig
