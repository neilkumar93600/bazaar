import Link from "next/link"
import { CheckIcon, SparklesIcon } from "lucide-react"

import type {
  BazaarAvailability,
  BazaarQuery,
  BazaarVibeFacet,
} from "@/lib/data/bazaar"
import { cn } from "@/lib/utils"
import { bazaarHref, toggleVibe } from "./href"

const AVAILABILITY_OPTIONS: { value: BazaarAvailability; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unclaimed", label: "Unclaimed" },
  { value: "claimed", label: "Claimed" },
]

/** Filters are links, not form state: the URL is the only source of truth, so
 *  every view is deep-linkable, the back button restores it, and the panel
 *  needs no client JS at all. */
export function BazaarFilterPanel({
  query,
  facets,
}: {
  query: BazaarQuery
  facets: BazaarVibeFacet[]
}) {
  const hasFilters = query.vibes.length > 0 || query.availability !== "all"

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-subheading text-foreground">Vibe</h2>
          {hasFilters && (
            <Link
              href={bazaarHref(query, { vibes: [], availability: "all" })}
              className="rounded-sm text-caption text-muted-foreground underline-offset-4 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Clear all
            </Link>
          )}
        </div>

        <ul className="mt-4 flex flex-col gap-1">
          {facets.map((facet) => {
            const checked = query.vibes.includes(facet.slug)
            return (
              <li key={facet.slug}>
                <Link
                  href={bazaarHref(query, {
                    vibes: toggleVibe(query.vibes, facet.slug),
                  })}
                  aria-label={
                    checked
                      ? `Remove ${facet.name} filter`
                      : `Filter by ${facet.name}, ${facet.count} designs`
                  }
                  className="group/row flex min-h-11 items-center gap-3 rounded-md px-2 transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-input/40 group-hover/row:border-steel"
                    )}
                  >
                    {checked && (
                      <CheckIcon className="size-3" strokeWidth={2.5} />
                    )}
                  </span>
                  <span
                    className={cn(
                      "flex-1 truncate text-body-sm",
                      checked ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {facet.name}
                  </span>
                  <span className="shrink-0 font-mono text-caption text-smoke">
                    {facet.count}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-subheading text-foreground">Availability</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((option) => {
            const active = query.availability === option.value
            return (
              <Link
                key={option.value}
                href={bazaarHref(query, { availability: option.value })}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-lg border px-3.5 text-body-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "border-transparent bg-sunset-sweep font-medium text-background"
                    : "border-border bg-card backdrop-blur-md text-muted-foreground hover:border-steel hover:text-foreground"
                )}
              >
                {option.label}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Reference layout puts a promo tile at the foot of the rail; here it's
          the one conversion slot on an otherwise read-only page. */}
      <Link
        href="/dashboard/create"
        className="group/promo glass-surface glass-surface-interactive relative flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl border bg-card p-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span aria-hidden className="absolute inset-0 bg-hero-atmosphere" />
        <SparklesIcon
          aria-hidden
          className="relative size-5 text-molten-amber"
          strokeWidth={1.5}
        />
        {/* Inter, not the display serif — 20px is well under the serif's 44px
            floor (docs/DESIGN.md "Do's and Don'ts"). */}
        <span className="relative mt-3 text-heading-sm text-foreground">
          Make your own
        </span>
        <span className="relative mt-1 text-body-sm text-muted-foreground">
          Generate a 1-of-1 and claim it before anyone else can.
        </span>
      </Link>
    </div>
  )
}
