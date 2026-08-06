import Link from "next/link"
import Image from "next/image"

import type { TopCreator } from "@/lib/data/home"
import { SectionTag } from "@/components/home/SectionTag"

/** Below this it isn't a "top creators" row, it's a list of the only accounts
 *  that exist — which on a new site reads as emptiness rather than proof. The
 *  section returns on its own once there are enough. */
const MIN_CREATORS = 3

export function TopCreatorsRow({ creators }: { creators: TopCreator[] }) {
  if (creators.length < MIN_CREATORS) return null

  return (
    // Header and row sit side by side rather than stacked, so this reads as one
    // line of the page instead of another titled card grid.
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,2fr)] lg:items-center lg:gap-16">
      <div className="flex flex-col gap-3">
        {/* Not "earning today" — a storefront existing isn't proof it has sold
            anything, and the payout path isn't even built yet. */}
        <SectionTag>Storefronts live</SectionTag>
        <h2 className="text-heading text-foreground">
          Early{" "}
          {/* One Fraunces italic word, as ever. */}
          <span className="font-serif font-medium italic">creators</span>
        </h2>
      </div>

      {/* Ruled columns, not cards: a vertical hairline between each name is
          enough separation, and it keeps the avatars as the only mass here. */}
      <div className="flex snap-x snap-mandatory overflow-x-auto">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creator/${creator.handle}`}
            className="group flex w-[132px] shrink-0 snap-start flex-col items-start gap-3 border-l border-border px-5 first:border-l-0 first:pl-0"
          >
            {creator.avatarUrl ? (
              <Image
                src={creator.avatarUrl}
                alt=""
                width={56}
                height={56}
                className="size-14 rounded-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full border border-border bg-background font-mono text-body-sm text-muted-gray">
                {(creator.displayName || creator.handle)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex w-full flex-col gap-0.5">
              <span className="w-full truncate text-body-sm font-medium text-foreground">
                @{creator.handle}
              </span>
              {/* A count is tabular meta, so it goes to mono — and "0 followers"
                  is worth less than the whitespace it takes, so it isn't drawn
                  until someone actually has one. */}
              {creator.followerCount > 0 && (
                <span className="font-mono text-caption text-muted-gray">
                  {creator.followerCount} follower
                  {creator.followerCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
