import type { HomeStats } from "@/lib/data/home"
import { CountUp } from "@/components/ui/motion"

export function StatsBar({ stats }: { stats: HomeStats }) {
  const items = [
    { value: stats.designsClaimed, prefix: "", label: "Designs claimed" },
    { value: stats.creatorCount, prefix: "", label: "Creators earning" },
    {
      value: Math.floor(stats.royaltiesPaidCents / 100),
      prefix: "$",
      label: "Royalties paid out",
    },
  ]

  return (
    <section className="w-full bg-secondary">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-8 px-4 py-12 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <CountUp
              value={item.value}
              prefix={item.prefix}
              className="text-display text-foreground"
            />
            <span className="text-body-sm text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
