"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const LEGAL_PAGES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/cookies", label: "Cookie Policy" },
] as const

export function LegalNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Legal pages" className="flex flex-wrap gap-2">
      {LEGAL_PAGES.map((page) => {
        const active = pathname === page.href
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-lg border px-3.5 text-body-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "border-transparent bg-sunset-sweep font-medium text-background"
                : "border-border bg-card text-muted-foreground backdrop-blur-md hover:border-steel hover:text-foreground"
            )}
          >
            {page.label}
          </Link>
        )
      })}
    </nav>
  )
}
