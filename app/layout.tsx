import type { Metadata } from "next"
import { Fraunces, Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils";
import { siteName, siteUrl } from "@/lib/site";

// The interface face — navigation, buttons, body and every headline
// (docs/DESIGN.md). Variable axis, no `weight` list: the system uses 400/500/600
// and one file serves all three. 700+ is deliberately unreachable, capped at 600
// in globals.css.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

// Technical labels, tabular meta and inline data. Brainfish keeps mono
// achromatic like everything else — it earns its distinction from the form.
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// The editorial signature: Fraunces italic on one emphasis word inside a Geist
// headline, and nowhere else — never body, never buttons, never a whole heading.
// Only the italic is ever set; the upright loads because next/font needs a base
// style. Variable axis, so 500 and 600 both come from one file.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: {
    // Primary keyword in the first three words; 53 characters, inside the
    // 60-char SERP limit.
    default: "1-of-1 AI Shirts, Claimed by One Owner | Shirt Bazaar",
    template: "%s — Shirt Bazaar",
  },
  // 151 characters: keyword in the first half, ends on a CTA verb, and no
  // audience or volume claim this site can't back yet.
  description:
    "1-of-1 AI shirt designs, claimed by exactly one owner. Every claim is permanent, comes with your own storefront, and pays 10% of every resale. Claim one.",
  openGraph: {
    title: "One prompt in. One shirt out. One owner.",
    // Deliberately not the meta description reworded — social gets the
    // conversational cut.
    description:
      "Nobody else can wear the design you claim. Every shirt on Shirt Bazaar exists exactly once, and the claim is permanent.",
    siteName: "Shirt Bazaar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI shirts that exist exactly once",
    description:
      "Claim a design and it's off the market for good — yours alone, with a storefront and 10% of every resale that follows.",
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
                description:
                  "Marketplace for 1-of-1 AI-generated apparel. Claim exclusive ownership of a design, get an auto-provisioned storefront, and earn a royalty on every resale.",
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
