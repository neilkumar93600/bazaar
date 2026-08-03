import Link from "next/link"

import type { VibeTile } from "@/lib/data/home"
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

export function VibeTiles({ vibes }: { vibes: VibeTile[] }) {
  if (vibes.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading-lg text-foreground">Shop by vibe</h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {vibes.map((vibe) => (
          <Link
            key={vibe.id}
            href={`/shop?vibe=${vibe.slug}`}
            className={cn(
              // bg-card paints the surface, the tint class layers its gradient
              // on top — the tint alone is a 12% wash, invisible on obsidian.
              "flex shrink-0 snap-start items-center gap-2 rounded-full border border-border bg-card backdrop-blur-md px-5 py-2.5 text-body font-medium text-foreground transition-colors hover:border-steel hover:bg-accent",
              tintClassFor(vibe.slug)
            )}
          >
            <span className="column-tint-dot size-2 rounded-full" aria-hidden />
            {vibe.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
