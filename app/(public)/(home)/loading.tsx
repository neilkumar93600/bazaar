import { Skeleton } from "@/components/ui/skeleton"

/** Scoped to `/` only (hence the `(home)` group) — a route-group-wide
 *  loading.tsx would also front `/shop`, `/about`, `/creator/[handle]` and
 *  every other public route, none of which look anything like this.
 *
 *  Mirrors the feed wall exactly: same column count per breakpoint, same
 *  height, so nothing shifts when the designs land. */
export default function Loading() {
  return (
    <div className="grid h-[calc(100svh-67px)] grid-cols-2 gap-3 overflow-hidden px-3 pb-3 md:grid-cols-3 md:gap-4 md:px-4 md:pb-4 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, column) => (
        <div
          key={column}
          className={
            // Matches Feed's TRACK_VISIBILITY — hidden columns never paint.
            column < 2
              ? "flex flex-col gap-4"
              : column === 2
                ? "hidden flex-col gap-4 md:flex"
                : "hidden flex-col gap-4 lg:flex"
          }
        >
          {Array.from({ length: 3 }, (_, card) => (
            <Skeleton key={card} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      ))}
    </div>
  )
}
