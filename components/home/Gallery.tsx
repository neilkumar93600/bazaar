"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { useThrottle } from "@/hooks/use-debounce"

import type { FeedColumn } from "@/lib/data/feed"
import type { VibeTile } from "@/lib/data/home"
import { DesignCard } from "@/components/shared/DesignCard"
import { SectionTag } from "@/components/home/SectionTag"
import { cn, hueFromString } from "@/lib/utils"

const TINT_CLASSES = [
  "column-tint-0",
  "column-tint-1",
  "column-tint-2",
  "column-tint-3",
  "column-tint-4",
  "column-tint-5",
  "column-tint-6",
  "column-tint-7",
]

function tintClassFor(slug: string) {
  return TINT_CLASSES[hueFromString(slug) % TINT_CLASSES.length]
}

const CAROUSEL_LIMIT = 12

/** The catalogue as a carousel of cards.
 *
 *  Uniform portrait cards on a scroll-snap track: a carousel is a rhythm, so the
 *  tiles are all one size and one crop. Native `overflow-x` scrolling does the
 *  work — the arrows only nudge it — so touch drag, trackpad swipe, shift-wheel
 *  and keyboard all keep working without a carousel dependency.
 *
 *  Sourced from the feed columns, which include unclaimed work, so it fills on a
 *  site where nothing has been claimed yet. */
export function Gallery({
  columns,
  vibes,
  designsLive,
}: {
  columns: FeedColumn[]
  vibes: VibeTile[]
  designsLive: number
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 0)
    // -1 for sub-pixel scroll widths, which otherwise leave the next arrow
    // enabled at the true end of the track.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  // RAF-throttled scroll handler prevents main-thread jank during rapid flicks.
  const { run: onScroll } = useThrottle(updateEdges)

  // Interleave across vibes so the opening cards mix aesthetics rather than
  // running one vibe from front to back.
  const longest = Math.max(0, ...columns.map((column) => column.designs.length))
  const designs = Array.from({ length: longest }, (_, row) =>
    columns.map((column) => column.designs[row]).filter(Boolean)
  )
    .flat()
    .slice(0, CAROUSEL_LIMIT)

  useEffect(() => {
    updateEdges()
  }, [updateEdges, designs.length])

  if (designs.length === 0) return null

  const scroll = (direction: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="flex flex-col gap-3">
          <SectionTag>Every one is the only one</SectionTag>
          <h2 className="text-heading text-foreground">
            The catalogue, {/* One Fraunces italic word, as ever. */}
            <span className="font-serif font-medium italic">unrepeated</span>
          </h2>
          <p className="max-w-[52ch] text-body-sm text-muted-ink">
            Unclaimed 1-of-1 AI shirt designs, one owner each. Claim one and it
            never appears on anyone else.
          </p>
        </div>

        {vibes.length > 0 && (
          <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 lg:mx-0 lg:justify-end lg:px-0">
            {vibes.map((vibe) => (
              <Link
                key={vibe.id}
                href={`/shop?vibe=${vibe.slug}`}
                // Pill Tag: transparent, 1px ink border, full radius. Tags are
                // the only pill-shaped thing in the system.
                className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-ink px-4 py-1.5 text-caption text-ink transition-colors hover:bg-secondary"
              >
                <span
                  className={cn(
                    "column-tint-dot size-1.5 rounded-full",
                    tintClassFor(vibe.slug)
                  )}
                  aria-hidden
                />
                {vibe.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* The track bleeds past the container so a card is always visibly cut off
          at the right edge — the affordance that says "this scrolls".

          `scroll-pl-*` is load-bearing, not decoration: `snap-start` aligns to
          the scrollport edge and ignores padding, so without a matching
          scroll-padding the browser silently scrolls the track by 64px on mount
          to snap card one flush, knocking the row out of line with the heading. */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-5 scroll-pl-6 overflow-x-auto px-6 pb-1 md:-mx-16 md:scroll-pl-16 md:px-16 lg:gap-6"
      >
        {designs.map((design, index) => (
          <DesignCard
            key={design.id}
            design={design}
            index={index}
            priority={index < 2}
            className="w-[240px] shrink-0 snap-start sm:w-[268px]"
            frameClassName="press-block border-ink"
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-6">
        <Link
          href="/shop"
          className="inline-flex w-fit items-center text-body-sm font-medium text-foreground"
        >
          <span className="border-b border-ink">
            Browse all {designsLive.toLocaleString()} designs
          </span>
        </Link>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={atStart}
            aria-label="Previous designs"
            className="flex size-9 items-center justify-center rounded-md border border-ink text-ink transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeftIcon className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={atEnd}
            aria-label="More designs"
            className="flex size-9 items-center justify-center rounded-md border border-ink text-ink transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRightIcon className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  )
}
