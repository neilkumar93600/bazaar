import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils";

// 300/400 for headline+body copy (docs/DESIGN_SYSTEM.md); 500 stays loaded
// only so reused shadcn primitives (buttons, badges, labels) keep rendering
// their stock `font-medium` chrome instead of a synthesized fake-bold.
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Shirt Bazaar",
    template: "%s — Shirt Bazaar",
  },
  description:
    "One-of-one, AI-generated t-shirt designs. Claim a design and own it — exclusively, with a royalty on every resale.",
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
        "dark antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>{children}</body>
    </html>
  )
}
