import type { FeedColumn } from "@/lib/data/feed"
import { SectionTag } from "@/components/home/SectionTag"
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"
import { DesignCard } from "@/components/shared/DesignCard"

const TRACK_COUNT = 5
const MAX_DESIGNS = 40

// Tracks the current breakpoint doesn't show are dropped entirely — hidden ones
// would still load their images.
const TRACK_VISIBILITY = [
  "flex",
  "flex",
  "hidden md:flex",
  "hidden lg:flex",
  "hidden lg:flex",
]

export function Feed({ columns }: { columns: FeedColumn[] }) {
  // Interleave the vibes so every track mixes aesthetics instead of running one
  // vibe top to bottom.
  const longest = Math.max(0, ...columns.map((column) => column.designs.length))
  const designs = Array.from({ length: longest }, (_, row) =>
    columns.map((column) => column.designs[row]).filter(Boolean)
  )
    .flat()
    .slice(0, MAX_DESIGNS)

  const tracks = Array.from({ length: TRACK_COUNT }, (_, track) =>
    designs.filter((_, index) => index % TRACK_COUNT === track)
  )

  return (
    <section id="vibe-feed" className="flex scroll-mt-24 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SectionTag>Live catalog</SectionTag>
        <h2 className="text-heading text-foreground">New drops</h2>
        <p className="text-body-sm text-muted-foreground">
          Unclaimed until someone takes them. Hover a column to hold it still.
        </p>
      </div>

      {/* `dvh`, not `vh`, on the track grid: the marquee needs a definite height
          to mask against, and `h-screen` re-measures as mobile Safari's toolbar
          collapses, which jumps the whole column mid-scroll. */}
      {designs.length > 0 ? (
        <div className="mask-fade-y grid h-[100dvh] grid-cols-2 gap-4 overflow-hidden md:grid-cols-3 lg:grid-cols-5">
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
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-subheading text-foreground">No drops yet</p>
          <p className="max-w-sm text-body-sm text-muted-foreground">
            New 1-of-1 AI designs land here constantly. Check back soon.
          </p>
        </div>
      )}
    </section>
  )
}
