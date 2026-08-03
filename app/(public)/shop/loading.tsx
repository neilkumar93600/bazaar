import { Skeleton } from "@/components/ui/skeleton"

import { BAZAAR_PAGE_SIZE } from "@/lib/data/bazaar"

// One screen's worth — skeletons past the fold cost layout work nobody sees.
const PLACEHOLDER_CARDS = Math.min(BAZAAR_PAGE_SIZE, 9)

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <aside className="hidden w-60 shrink-0 flex-col gap-8 lg:flex">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-20" />
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-28" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-44 w-full rounded-2xl" />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-64 lg:h-12" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-9 w-44 rounded-3xl" />
            </div>

            <Skeleton className="mt-8 h-16 w-full rounded-2xl lg:hidden" />

            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:mt-10 xl:gap-x-6">
              {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
