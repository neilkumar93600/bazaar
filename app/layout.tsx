import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils";
import { siteName, siteUrl } from "@/lib/site";

// 300/400 for headline+body copy (docs/DESIGN_SYSTEM.md); 500 stays loaded
// only so reused shadcn primitives (buttons, badges, labels) keep rendering
// their stock `font-medium` chrome instead of a synthesized fake-bold.
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: {
    default: "Shirt Bazaar | AI 1-of-1 Apparel & Storefronts",
    template: "%s — Shirt Bazaar",
  },
  description:
    "Turn one prompt into 1-of-1 AI apparel only you own. Claim your design, launch an instant storefront, and earn royalties on every resale. Start free.",
  openGraph: {
    title: "Shirt Bazaar — One Prompt. One Shirt. One Owner.",
    description:
      "One prompt in, one shirt out, one owner — you. Claim AI-generated designs, run your own storefront, and get paid when they resell.",
    siteName: "Shirt Bazaar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shirt Bazaar — One Prompt. One Shirt. One Owner.",
    description:
      "Claim AI-generated 1-of-1 apparel nobody else can wear, and earn a royalty every time your design resells.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <script
          type="application/ld+json"
          // Static, non-user-derived literal — nothing here is attacker-controlled.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: siteName,
                url: siteUrl,
                description:
                  "Marketplace for 1-of-1 AI-generated apparel. Claim exclusive ownership of a design, get an auto-provisioned storefront, and earn a royalty on every resale.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: siteName,
                url: siteUrl,
                // No SearchAction: /search is still a ComingSoon stub. Add it
                // once the route actually handles ?q= and returns results.
              },
            ]),
          }}
        />
        {children}
      </body>
    </html>
  )
}
