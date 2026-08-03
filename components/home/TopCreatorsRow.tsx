import Link from "next/link"
import Image from "next/image"

import type { TopCreator } from "@/lib/data/home"

export function TopCreatorsRow({ creators }: { creators: TopCreator[] }) {
  if (creators.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading-lg text-foreground">Top creators</h2>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creator/${creator.handle}`}
            className="flex w-[160px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-border p-4 text-center transition-colors hover:bg-secondary"
          >
            {creator.avatarUrl ? (
              <Image
                src={creator.avatarUrl}
                alt=""
                width={64}
                height={64}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-muted text-lg text-muted-foreground">
                {(creator.displayName || creator.handle)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
            <span className="truncate text-body-sm font-medium text-foreground">
              @{creator.handle}
            </span>
            <span className="text-caption text-muted-foreground">
              {creator.followerCount} follower
              {creator.followerCount === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
