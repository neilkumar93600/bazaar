"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/** A horizontal strip that scrolls.
 *
 *  ponytail: CSS scroll-snap and a `scrollBy` call, not a carousel library.
 *  Native overflow scrolling already gives touch, trackpad, keyboard and
 *  momentum for free on every device — the arrows exist only because a desktop
 *  mouse has none of those. Reach for a library the day this needs autoplay,
 *  infinite looping or synced pagination, which nothing here asks for.
 */
export function Carousel({
  children,
  className,
  itemClassName,
  label,
}: {
  children: React.ReactNode
  className?: string
  /** Width of each slide. Defaults to a card-sized column. */
  itemClassName?: string
  /** Accessible name for the scrolling region. */
  label: string
}) {
  const track = useRef<HTMLDivElement>(null)

  const scroll = (direction: 1 | -1) => {
    const node = track.current
    if (!node) return
    // A bit less than a full pane, so the edge card stays half-visible and the
    // strip reads as continuing.
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" })
  }

  const items = Array.isArray(children) ? children : [children]

  return (
    <div className={cn("relative", className)}>
      <div
        ref={track}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, index) => (
          <div
            key={index}
            className={cn("shrink-0 snap-start", itemClassName ?? "w-44 sm:w-52")}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Desktop only: touch and trackpad already scroll this. */}
      <div className="pointer-events-none absolute inset-y-0 -left-3 -right-3 hidden items-center justify-between lg:flex">
        <ArrowButton direction="left" onClick={() => scroll(-1)} />
        <ArrowButton direction="right" onClick={() => scroll(1)} />
      </div>
    </div>
  )
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right"
  onClick: () => void
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      // rounded-lg is the 4px button step. docs/DESIGN.md: buttons are 4px or
      // 0px, and a pill is a tag or a status — never a control. The 2px ink
      // offset sits at rest and comes off on press, which is the system's one
      // shadow and its one press affordance.
      className="pointer-events-auto flex size-9 items-center justify-center rounded-lg border border-ink bg-paper-white text-ink shadow-[2px_2px_0px_0px_#262626] transition-transform active:translate-y-px active:shadow-none"
    >
      <Icon className="size-4" />
    </button>
  )
}
