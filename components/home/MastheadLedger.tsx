import type { HomeStats } from "@/lib/data/home"
import { CountUp } from "@/components/ui/motion"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"

type Entry = {
  key: string
  value: number
  prefix?: string
  suffix?: string
  label: string
  /** Counts up from zero when scrolled into view. Off for values that aren't a
   *  growing quantity — a fixed rate animating from "0%" reads, for the length
   *  of the animation, as the opposite of the offer. */
  animate?: boolean
}

/** Two kinds of entry. The launch facts are true the day the catalogue exists, so
 *  the ledger still says something on a site with no users yet. Traction metrics
 *  only join once they're non-zero — "0 creators earning" on the front page is an
 *  argument against signing up — and each reappears on its own the moment
 *  there's a real number behind it.
 *
 *  Exported so `MastheadLedger.test.ts` can pin the zero-state without a
 *  renderer. */
export function buildLedgerEntries(stats: HomeStats): Entry[] {
  const launchFacts: Entry[] = [
    {
      key: "live",
      value: stats.designsLive,
      label: "Designs live",
      animate: true,
    },
    {
      key: "unclaimed",
      value: stats.designsUnclaimed,
      label: "Still unclaimed",
      animate: true,
    },
    {
      key: "royalty",
      value: ROYALTY_RATE_PERCENT,
      suffix: "%",
      label: "Your cut of every resale",
    },
    { key: "owners", value: 1, label: "Owner per design. Ever." },
  ]

  const traction: Entry[] = [
    {
      key: "claimed",
      value: stats.designsClaimed,
      label: "Designs claimed",
      animate: true,
    },
    {
      key: "creators",
      value: stats.creatorCount,
      label: "Creators earning",
      animate: true,
    },
    {
      key: "royalties",
      value: Math.floor(stats.royaltiesPaidCents / 100),
      prefix: "$",
      label: "Royalties paid out",
      animate: true,
    },
  ].filter((entry) => entry.value > 0)

  return [...launchFacts, ...traction]
}

/** The masthead rule directly under the hero.
 *
 *  Replaces what used to be two separate sections — a four-up "why claim" strip
 *  and a stats band further down — that were both making the same kind of
 *  numeric claim in the same shape. One ledger, read left to right, states the
 *  terms of the place once. */
export function MastheadLedger({ stats }: { stats: HomeStats }) {
  const entries = buildLedgerEntries(stats)

  return (
    <section className="w-full border-y border-ink bg-card">
      <div className="mx-auto grid w-full max-w-page grid-cols-1 px-6 md:px-16 lg:grid-cols-4">
        {entries.map((entry) => (
          <div
            key={entry.key}
            // Hairline cells rather than cards — the rules do the separating, so
            // there's nothing to elevate. One rule per axis: stacked rows get a
            // top rule, the desktop grid gets left rules, and every cell that
            // *starts* a row drops its own. `nth-child(4n+1)`, not `first`:
            // with more than four entries the fifth cell opens row two, and a
            // left rule there would hang off the container edge.
            className="flex flex-col gap-1.5 border-t border-border py-6 first:border-t-0 lg:border-t-0 lg:border-l lg:px-6 lg:py-8 lg:nth-[4n+1]:border-l-0 lg:nth-[4n+1]:pl-0"
          >
            {entry.animate ? (
              <CountUp
                value={entry.value}
                prefix={entry.prefix}
                suffix={entry.suffix}
                className="text-heading text-ink"
              />
            ) : (
              <span className="text-heading text-ink">
                {entry.prefix}
                {entry.value.toLocaleString()}
                {entry.suffix}
              </span>
            )}
            <span className="max-w-[24ch] text-caption text-muted-ink">
              {entry.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
