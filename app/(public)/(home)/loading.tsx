import { Skeleton } from "@/components/ui/skeleton"

/** Scoped to `/` only (hence the `(home)` group) — a route-group-wide
 *  loading.tsx would also front `/shop`, `/about`, `/creator/[handle]` and
 *  every other public route, none of which look anything like this.
 *
 *  Mirrors the hero band, which is the whole above-the-fold view. The hero
 *  itself needs no data; it blocks only because the page awaits the five feed
 *  queries before rendering anything. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Same frame as Hero: inset video card, nav pill top, headline and form
          card along the bottom. */}
      <section className="w-full p-3 sm:p-4 md:p-6">
        <div className="relative flex min-h-[calc(100dvh-24px)] flex-col gap-6 overflow-hidden rounded-xl bg-pitch p-4 sm:min-h-[calc(100dvh-32px)] sm:p-6 md:min-h-[calc(100dvh-48px)] md:p-8">
          <div aria-hidden className="absolute inset-0 bg-hero-atmosphere" />

          <Skeleton className="relative h-[52px] w-full rounded-lg sm:w-[420px]" />

          <div className="min-h-[2rem] flex-1" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 lg:max-w-lg xl:max-w-2xl">
              <Skeleton className="h-9 w-[320px] sm:h-11 xl:h-12" />
              <Skeleton className="h-9 w-[220px] sm:h-11 xl:h-12" />
            </div>

            <Skeleton className="h-[420px] w-full shrink-0 rounded-xl lg:w-[min(480px,45%)]" />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-page flex-col gap-20 px-6 md:px-16">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
