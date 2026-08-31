"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Shield, RotateCcw, Cookie, Scale } from "lucide-react"

import { cn } from "@/lib/utils"

export const LEGAL_PAGES = [
  {
    href: "/terms",
    label: "Terms of Service",
    shortLabel: "Terms",
    icon: FileText,
    badge: "Binding",
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    shortLabel: "Privacy",
    icon: Shield,
    badge: "GDPR / CCPA",
  },
  {
    href: "/refund-policy",
    label: "Refund & Reprints",
    shortLabel: "Refunds",
    icon: RotateCcw,
    badge: "14-Day",
  },
  {
    href: "/cookies",
    label: "Cookie Policy",
    shortLabel: "Cookies",
    icon: Cookie,
    badge: "Zero-Ad",
  },
  {
    href: "/ip-policy",
    label: "Commercial IP & DMCA",
    shortLabel: "IP & DMCA",
    icon: Scale,
    badge: "100% Rights",
  },
] as const

export function LegalNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Legal policies"
      className={cn(
        "flex w-full items-center gap-2 overflow-x-auto rounded-[8px] border border-rule bg-cream p-2 scrollbar-none",
        className
      )}
    >
      {LEGAL_PAGES.map((page) => {
        const active = pathname === page.href
        const Icon = page.icon

        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex shrink-0 items-center gap-2 rounded-[4px] px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:text-sm",
              active
                ? "border border-ink bg-lime-sprint text-ink font-semibold shadow-[2px_2px_0_0_#262626]"
                : "border border-transparent text-muted-ink hover:border-rule hover:bg-paper-white hover:text-ink"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                active ? "text-ink" : "text-muted-gray group-hover:text-ink"
              )}
            />
            <span>{page.label}</span>
            {page.badge && (
              <span
                className={cn(
                  "hidden rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase md:inline-block",
                  active
                    ? "border border-ink bg-paper-white text-ink"
                    : "border border-rule bg-paper-white text-muted-gray group-hover:border-ink group-hover:text-ink"
                )}
              >
                {page.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
