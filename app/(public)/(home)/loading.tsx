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
    <div className="flex flex-col gap-12 pb-10 sm:pb-14">
      <section className="relative flex min-h-[700px] w-full flex-col items-center justify-center overflow-hidden bg-pitch px-6 lg:h-[100dvh] lg:min-h-[850px]">
        <div aria-hidden className="absolute inset-0 bg-hero-atmosphere" />

        <div className="relative flex w-full max-w-[920px] flex-col items-center gap-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-[52px] w-full max-w-[840px] sm:h-[64px] md:h-[80px] lg:h-[96px]" />
          <Skeleton className="h-[52px] w-full max-w-[620px] sm:h-[64px] md:h-[80px] lg:h-[96px]" />

          <div className="mt-2 flex w-full max-w-[720px] flex-col items-center gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="mt-4 flex flex-col items-center gap-3.5 sm:flex-row">
            <Skeleton className="h-[46px] w-[210px] rounded-full md:h-[50px]" />
            <Skeleton className="h-[46px] w-[190px] rounded-full md:h-[50px]" />
          </div>
        </div>

        <Skeleton className="absolute bottom-8 h-4 w-72" />
      </section>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-4 sm:px-6 lg:px-8">
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
