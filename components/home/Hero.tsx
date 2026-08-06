"use client"

import { useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"

import type { VibeTile } from "@/lib/data/home"
import { HeroPromptForm } from "@/components/home/HeroPromptForm"
import { MenuToggle } from "@/components/layout/MenuToggle"
import { Logo } from "@/components/ui/logo"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Matches hooks/use-mobile.ts's 768px breakpoint. One query, because the two
// conditions are asked together and never apart.
const VIDEO_OK = "(min-width: 768px) and (prefers-reduced-motion: no-preference)"

// "Home" is omitted — this nav only ever renders on it.
const HERO_LINKS = [
  { href: "/shop", label: "Bazaar" },
  { href: "/auctions", label: "Auctions" },
  { href: "#vibe-feed", label: "Feed" },
]

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(VIDEO_OK)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function Hero({
  vibes,
  unclaimedCount,
}: {
  vibes: VibeTile[]
  /** Designs nobody owns yet. Drives the status pill; zero hides it. */
  unclaimedCount: number
}) {
  // The clip is ambiance, not content — the poster carries the same frame, so
  // phones and reduced-motion users get the still and skip the 1.5MB download
  // entirely rather than loading a video that's then hidden.
  //
  // The server can't know the viewport, so it gets an explicit `false`
  // snapshot: SSR and the first client pass both render no video, which is
  // what keeps this from being a hydration mismatch.
  const showVideo = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(VIDEO_OK).matches,
    () => false
  )

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    // The frame is inset from the page edge, so the section itself is just the
    // white margin. `id` stays: Navbar measures this element to decide when the
    // global bar takes over from the pill inside the card.
    <section
      id="auro-header-section"
      className="w-full p-3 select-none sm:p-4 md:p-6"
    >
      {/* `min-h` at every step and never a fixed `h`: the frame clips overflow,
          so a hard height plus a tall prompt form silently ate the form's bottom
          180px on a 1024x700 laptop. Filling the viewport is a floor here, not a
          ceiling — the hero grows when the content needs the room. */}
      <div className="relative min-h-[calc(100dvh-24px)] w-full overflow-hidden rounded-xl sm:min-h-[calc(100dvh-32px)] md:min-h-[calc(100dvh-48px)]">
        {/* Background: the shirt bazaar itself — poster paints immediately, the
            clip fades in over it once it can play. */}
        <Image
          src="/bazaar/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {showVideo && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/bazaar/hero.jpg"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
          >
            <source src="/bazaar/hero.mp4" type="video/mp4" />
          </video>
        )}
        {/* The headline sits on white text over daylight market footage, so it
            needs a scrim of its own — drop-shadow alone doesn't hold on the
            pale garments. Bottom-weighted, to leave the top of the scene clear
            behind the nav pill. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent"
        />
        {/* The one atmospheric effect in the system — a soft lime radial anchored
            to the upper-right quadrant. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-atmosphere"
        />

        <div className="relative z-10 flex min-h-[calc(100dvh-24px)] flex-col gap-4 p-4 sm:gap-6 sm:min-h-[calc(100dvh-32px)] sm:p-6 md:min-h-[calc(100dvh-48px)] md:p-8">
          {/* Frosted pill nav. The global Navbar renders nothing until the
              visitor scrolls past this section, so the two never stack. */}
          {/* `self-start` matters: the parent is a stretch flex column, so
              `md:w-auto` alone would still stretch the pill edge to edge. */}
          <nav className="flex w-full items-center gap-2 rounded-lg bg-white/60 py-2 pr-2 pl-3 shadow-[var(--shadow-card)] backdrop-blur-md md:w-auto md:gap-6 md:self-start md:pl-4">
            {/* The wordmark is `whitespace-nowrap` and so is the CTA, so at 360px
                the pair overflowed the pill by 36px and the frame's
                `overflow-hidden` ate the right edge of the button. The mark alone
                carries the brand on the narrowest screens; the wordmark returns
                at `sm`, and the links wait for `md` where there's room for all
                three at once. */}
            <Logo
              textClassName="hidden text-body font-semibold whitespace-nowrap text-foreground sm:inline"
              className="shrink-0"
            />

            <div className="hidden items-center gap-6 md:flex">
              {HERO_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body-sm font-medium whitespace-nowrap text-ink transition-opacity hover:opacity-60"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              href="/dashboard/create"
              className="btn-ember ml-auto hidden px-3.5 py-1.5 text-body-sm font-medium whitespace-nowrap md:inline-flex md:px-5"
            >
              Start creating
            </Link>

            {/* Below md the links above are hidden and the global navbar hasn't
                appeared yet, so without this the hero is a dead end on a phone.
                Same toggle and same panel shape as the global bar. */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <button
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    className="ml-auto flex shrink-0 items-center justify-center rounded-md border border-ink p-2.5 text-ink transition-colors hover:bg-secondary md:hidden"
                  >
                    <MenuToggle open={menuOpen} />
                  </button>
                }
              />
              <SheetContent
                side="right"
                className="flex flex-col gap-1 border-border p-0 text-foreground"
              >
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle>
                    <Logo textClassName="text-foreground" />
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 p-4">
                  {HERO_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2.5 text-body-sm text-muted-ink hover:bg-accent hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-2.5 text-body-sm text-muted-ink hover:bg-accent hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/dashboard/create"
                    onClick={() => setMenuOpen(false)}
                    className="btn-ember px-4 py-2.5 text-center text-body-sm font-medium"
                  >
                    Start creating
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </nav>

          {/* No forced gap on a phone — every pixel here comes off the form. */}
          <div className="min-h-0 flex-1 sm:min-h-[2rem]" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex shrink-0 flex-col items-start gap-4 lg:max-w-lg xl:max-w-2xl">
              {/* Status Pill Badge, and the only proof line here: a real count
                  of what nobody owns yet. It beats a trust claim this site
                  hasn't earned, and it disappears on its own if the catalogue
                  is ever fully claimed. */}
              {unclaimedCount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-mint-edge bg-mint-wash px-3 py-1 text-caption font-medium text-ink">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-mint-edge"
                  />
                  {unclaimedCount.toLocaleString()} design
                  {unclaimedCount === 1 ? "" : "s"} still unclaimed
                </span>
              )}

              <h1 className="text-3xl leading-[1.16] font-semibold tracking-[-0.005em] text-white drop-shadow-lg sm:text-4xl xl:text-5xl">
                {/* The space before the break is load-bearing: without it the
                    accessible name and the crawled text read "existexactly". */}
                AI shirts that exist{" "}
                <br />
                exactly{" "}
                {/* The system's signature: exactly one Fraunces italic word
                    inside a Geist headline. One — not two (docs/DESIGN.md). */}
                <span className="font-serif font-medium italic">once</span>
              </h1>

              {/* The keyword work happens here rather than in the headline —
                  "1-of-1 AI shirt design", "claim", "resale" all land in prose
                  a person would actually read aloud. */}
              <p className="line-clamp-2 max-w-[46ch] text-body text-white/85 drop-shadow-md sm:line-clamp-none">
                Every 1-of-1 AI shirt design here can be claimed by one person.
                After that it leaves the market for good — and you keep 10% of
                every resale that follows.
              </p>
            </div>

            <HeroPromptForm vibes={vibes} />
          </div>
        </div>
      </div>
    </section>
  )
}
