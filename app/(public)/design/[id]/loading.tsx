import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the page's two-column shape so the layout doesn't jump when the
 *  real thing lands. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-12 px-6 py-10 md:px-16 sm:py-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2 lg:col-span-8">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl sm:aspect-square" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-3/4" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
