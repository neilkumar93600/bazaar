import type { Metadata } from "next"
import { Bebas_Neue, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils";

// Pinned to regular + medium only — docs/DESIGN_SYSTEM.md reserves any
// heavier weight strictly for the display face (Bebas Neue).
const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans" })

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
})

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
        bebasNeue.variable,
      )}
    >
      <body>{children}</body>
    </html>
  )
}
