import type { FeedColumn } from "@/lib/data/feed"
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"
import { DesignCard } from "@/components/shared/DesignCard"

// One track per grid column at the widest breakpoint — a sixth column with no
// sixth track would just be a hole in the wall.
const TRACK_COUNT = 6
const MAX_DESIGNS = 48

// Tracks the current breakpoint doesn't show are dropped entirely — hidden ones
// would still load their images.
const TRACK_VISIBILITY = [
  "flex",
  "flex",
  "hidden md:flex",
  "hidden lg:flex",
  "hidden lg:flex",
  "hidden lg:flex",
]

/** The wall of drops, and the whole homepage. Edge to edge, one viewport tall,
 *  sitting directly under the navbar — the footer is the only thing below it. */
export function Feed({ columns }: { columns: FeedColumn[] }) {
  // Interleave the vibes so every track mixes aesthetics instead of running one
  // vibe top to bottom.
  const longest = Math.max(0, ...columns.map((column) => column.designs.length))
  const designs = Array.from({ length: longest }, (_, row) =>
    columns.map((column) => column.designs[row]).filter(Boolean)
  )
    .flat()
    .slice(0, MAX_DESIGNS)

  // Contiguous slices, not `index % TRACK_COUNT`: round-robin over an
  // interleaved list hands vibe *i* to track *i* whenever the vibe count and
  // the track count line up, which puts one aesthetic per column — the exact
  // thing the interleave above exists to prevent. A slice of consecutive
  // interleaved designs spans every vibe no matter how many there are.
  const perTrack = Math.ceil(designs.length / TRACK_COUNT)
  const tracks = Array.from({ length: TRACK_COUNT }, (_, track) =>
    designs.slice(track * perTrack, (track + 1) * perTrack)
  )

  if (designs.length === 0) {
    return (
      <section className="flex min-h-[calc(100dvh-67px)] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-subheading text-foreground">No drops yet</p>
        <p className="max-w-sm text-body-sm text-muted-foreground">
          New 1-of-1 AI designs land here constantly. Check back soon.
        </p>
      </section>
    )
  }

  return (
    // `dvh`, not `vh`: the marquee needs a definite height to mask against, and
    // `h-screen` re-measures as mobile Safari's toolbar collapses, which jumps
    // the whole wall mid-scroll. The 67px is the navbar's fixed row height —
    // the wall fills exactly what's left, so the footer starts one scroll down.
    <section className="mask-fade-y grid h-[calc(100dvh-67px)] grid-cols-2 gap-3 overflow-hidden px-3 pb-3 md:grid-cols-3 md:gap-4 md:px-4 md:pb-4 lg:grid-cols-6">
      {tracks.map((track, index) => (
        <Marquee
          key={index}
          vertical
          pauseOnHover
          reverse={index % 2 === 1}
          repeat={2}
          className={cn(
            "h-full min-w-0 p-0 [--duration:70s] [--gap:1rem]",
            TRACK_VISIBILITY[index]
          )}
        >
          {track.map((design) => (
            <DesignCard key={design.id} design={design} />
          ))}
        </Marquee>
      ))}
    </section>
  )
}
