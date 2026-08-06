import type { Metadata } from "next"
import { SlidersHorizontalIcon } from "lucide-react"

import { BazaarFilterPanel } from "@/components/bazaar/BazaarFilters"
import { BazaarGrid } from "@/components/bazaar/BazaarGrid"
import { BazaarSort } from "@/components/bazaar/BazaarSort"
import { bazaarHref } from "@/components/bazaar/href"
import {
  getBazaarData,
  parseBazaarQuery,
  type BazaarSort as BazaarSortValue,
} from "@/lib/data/bazaar"

export const metadata: Metadata = {
  title: "Bazaar",
  description:
    "Browse every 1-of-1 AI apparel design on Shirt Bazaar. Filter by vibe, see what's still unclaimed, and claim yours before someone else does.",
  alternates: { canonical: "/shop" },
}

const SORT_LABELS: Record<BazaarSortValue, string> = {
  recent: "Most Recent",
  oldest: "Oldest First",
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const query = parseBazaarQuery(await props.searchParams)
  const data = await getBazaarData(query)

  const sortOptions = (Object.keys(SORT_LABELS) as BazaarSortValue[]).map(
    (value) => ({
      value,
      label: SORT_LABELS[value],
      href: bazaarHref(query, { sort: value }),
    })
  )

  const filters = <BazaarFilterPanel query={query} facets={data.facets} />

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-page px-6 py-10 md:px-16 lg:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <aside className="hidden w-60 shrink-0 lg:sticky lg:top-24 lg:block">
            {filters}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {/* Inter — 22/24px is under the display serif's 44px floor. */}
                <h1 className="text-heading text-foreground lg:text-heading-lg">
                  The Bazaar
                </h1>
                <p className="mt-2 text-caption tracking-[0.14em] text-muted-foreground uppercase">
                  {data.totalCount}{" "}
                  {data.totalCount === 1 ? "design" : "designs"} found
                </p>
              </div>
              <BazaarSort value={query.sort} options={sortOptions} />
            </div>

            {/* Mobile gets the same panel behind a native disclosure — no JS, no
                sheet, and it collapses out of the way once a filter is picked. */}
            <details className="group/filters glass-surface mt-8 rounded-2xl border bg-card p-4 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-body font-medium text-foreground [&::-webkit-details-marker]:hidden">
                <SlidersHorizontalIcon
                  aria-hidden
                  className="size-4"
                  strokeWidth={1.5}
                />
                Filters
              </summary>
              <div className="mt-6">{filters}</div>
            </details>

            <div className="mt-8 lg:mt-10">
              <BazaarGrid data={data} query={query} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
