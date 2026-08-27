import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { BazaarGrid } from "@/components/bazaar/BazaarGrid"
import { SearchField } from "@/components/bazaar/SearchField"
import { ChibiGhost } from "@/components/shared/ChibiGhost"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getBazaarData, parseBazaarQuery } from "@/lib/data/bazaar"
import { searchCreators } from "@/lib/data/search"

export async function generateMetadata(
  props: PageProps<"/search">
): Promise<Metadata> {
  const { q } = parseBazaarQuery(await props.searchParams)

  return {
    title: q ? `“${q}”` : "Search",
    description:
      "Search every 1-of-1 design on Shirt Bazaar by what it was made from, and find the creators who claimed them.",
    // Result pages are thin and infinite in combination — the canonical points
    // at the one browsable page behind them.
    alternates: { canonical: "/shop" },
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: PageProps<"/search">) {
  const query = parseBazaarQuery(await props.searchParams)

  // Both reads are independent; a slow creator lookup shouldn't hold the grid.
  const [data, creators] = await Promise.all([
    query.q ? getBazaarData(query) : null,
    searchCreators(query.q),
  ])

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-6 py-16 md:px-16 sm:py-24">
      <div className="flex flex-col gap-6">
        <h1 className="text-heading-lg text-foreground">
          {query.q ? (
            <>
              Results for{" "}
              <span className="font-serif font-medium italic">{query.q}</span>
            </>
          ) : (
            "Search"
          )}
        </h1>

        <SearchField defaultValue={query.q} />
      </div>

      {!query.q ? (
        <Empty className="glass-surface rounded-3xl bg-card text-card-foreground">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ChibiGhost variant="dapper" size={96} interactive={false} />
            </EmptyMedia>
            <EmptyTitle>Search designs and creators</EmptyTitle>
            <EmptyDescription>
              Designs match on their name and description. Creators match on
              handle or name.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {creators.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
                Creators
              </h2>
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
                      <span className="font-mono text-caption text-muted-gray">
                        {creator.claimCount} claimed
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data && (
            <section className="flex flex-col gap-4">
              <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
                Designs
                {data.totalCount > 0 && ` · ${data.totalCount}`}
              </h2>
              <BazaarGrid data={data} query={query} basePath="/search" />
            </section>
          )}
        </>
      )}
    </div>
  )
}
