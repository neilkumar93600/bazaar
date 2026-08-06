import type { ReactNode } from "react"

/** The site's social profiles, in one place because the footer and the hero
 *  prompt card both render them.
 *
 *  Fill in a real profile URL to have that icon appear — entries with a null
 *  href stay hidden rather than linking to "#", so an unlaunched account is
 *  never advertised. lucide dropped its brand icons in v1, hence the inline
 *  SVGs. */
export const SOCIAL_LINKS: {
  label: string
  href: string | null
  icon: ReactNode
}[] = [
  {
    label: "TikTok",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.77 0 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 00-.79-.05 6.34 6.34 0 000 12.68 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current">
        <path d="M23 7s-.3-1.9-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5.1 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 1.9 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.5 12 21.5 12 21.5s4.2 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.7 1.2-2.7s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8 3.6-8 3.5z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: null,
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-current"
        strokeWidth="2"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    ),
  },
]
