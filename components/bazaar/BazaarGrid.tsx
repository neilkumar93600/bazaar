import Link from "next/link"
import { ShirtIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { BazaarData, BazaarQuery } from "@/lib/data/bazaar"
import { DesignCard } from "@/components/shared/DesignCard"
import { bazaarHref } from "./href"

export function BazaarGrid({
  data,
  query,
  basePath = "/shop",
}: {
  data: BazaarData
  query: BazaarQuery
  /** Route the pagination and clear-filter links point back at. `/search`
   *  renders this same grid against the same query shape. */
  basePath?: string
}) {
  if (data.designs.length === 0) {
    const searched = query.q.length > 0
    const filtered = query.vibes.length > 0 || query.availability !== "all"

    return (
      <Empty className="glass-surface rounded-3xl bg-card text-card-foreground">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShirtIcon />
          </EmptyMedia>
          <EmptyTitle>
            {searched
              ? `No designs match “${query.q}”`
              : filtered
                ? "Nothing matches those filters"
                : "The bazaar is still filling up"}
          </EmptyTitle>
          <EmptyDescription>
            {searched
              ? "Search reads the prompt each design was made from. Try a plainer word, or browse the whole bazaar."
              : filtered
                ? "Try widening the vibe selection or switching availability back to All."
                : "New 1-of-1 designs land here as they clear moderation. Check back shortly."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {searched ? (
            <Button variant="outline" render={<Link href="/shop" />}>
              Browse the bazaar
            </Button>
          ) : filtered ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={bazaarHref(
                    query,
                    { vibes: [], availability: "all" },
                    basePath
                  )}
                />
              }
            >
              Clear filters
            </Button>
          ) : (
            <Button variant="outline" render={<Link href="/" />}>
              Back to the feed
            </Button>
          )}
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:gap-x-6">
        {data.designs.map((design, index) => (
          <DesignCard
            key={design.id}
            design={design}
            index={index}
            priority={index < 3}
          />
        ))}
      </div>

      {data.pageCount > 1 && (
        <nav
          aria-label="Bazaar pages"
          className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6"
        >
          {data.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={bazaarHref(query, { page: data.page - 1 }, basePath)}
                />
              }
            >
              Previous
            </Button>
          ) : (
            <span />
          )}

          <span className="font-mono text-caption text-muted-foreground">
            {data.page} / {data.pageCount}
          </span>

          {data.page < data.pageCount ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={bazaarHref(query, { page: data.page + 1 }, basePath)}
                />
              }
            >
              Next
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  )
}
