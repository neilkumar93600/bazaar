import type { Metadata } from "next"
import { Fraunces, Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils";
import { CONTACT_EMAILS, siteName, siteUrl } from "@/lib/site";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Custom Merch Store & IP Rights: Launch Your Brand | Shirt Bazaar",
    template: "%s — Shirt Bazaar",
  },
  description:
    "Buy the genesis shirt, secure 100% IP ownership, and get your custom automated merch store built for you. Start selling and keep full profits today.",
  keywords: [
    "merch",
    "streetwear",
    "apparel",
    "clothing",
    "storefront",
    "fashion",
    "tshirt",
    "creator",
    "dropship",
    "branding",
    "custom merch store builder",
    "buy shirt own commercial rights",
    "turnkey merchandise brand",
    "own the IP merch",
    "launch merch line zero inventory",
    "automated custom clothing store",
    "1-of-1 AI apparel",
    "turn shirt design into brand",
    "print on demand with full IP ownership",
    "custom merchandise storefront dropship",
    "commercial clothing design rights",
    "automated apparel fulfillment for creators",
    "creator brand starter kit",
    "start a merch line without inventory",
    "exclusive streetwear 1-of-1 drops",
    "digital certificate apparel ownership",
    "AI generative fashion marketplace",
    "merch store auto provision",
  ],
  authors: [{ name: "Shirt Bazaar" }],
  creator: "Shirt Bazaar",
  publisher: "Shirt Bazaar",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: "Buy The Shirt. Own The IP. We Build Your Merch Store.",
    description:
      "No inventory hassles. No design guesswork. Get the physical piece, full commercial rights, and an instant automated storefront ready to take orders.",
    images: [
      {
        url: `${siteUrl}/seo/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Shirt Bazaar — Buy The Shirt, Own The IP, We Create Your Custom Merch Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn 1 Shirt Into Your Own Merch Store (With Full IP Ownership)",
    description:
      "We bundle physical apparel with legal IP ownership and a ready-to-sell custom store. Step into brand ownership with one purchase.",
    images: [`${siteUrl}/seo/twitter-card.png`],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
        geist.variable,
        fraunces.variable,
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
                logo: `${siteUrl}/icons/android-chrome-512x512.png`,
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  email: CONTACT_EMAILS.support,
                },
                description:
                  "Turnkey 1-of-1 apparel marketplace and automated merch store platform. Buy exclusive shirts, own 100% commercial IP rights, and launch an automated custom merch storefront with zero inventory.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: siteName,
                url: siteUrl,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteUrl}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        {children}
      </body>
    </html>
  )
}
