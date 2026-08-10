import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowUpRight, Plus, Sparkles, Shirt, TrendingUp } from "lucide-react";

import { getDashboardOverview } from "@/lib/data/dashboard";
import { PAYOUT_THRESHOLD_CENTS } from "@/lib/royalty";
import { formatCents } from "@/lib/utils";
import { DashboardAnalyticsChart } from "@/components/dashboard/DashboardAnalyticsChart";
import { RoyaltyGoalGauge } from "@/components/dashboard/RoyaltyGoalGauge";
import { CreationQuotaGauge } from "@/components/dashboard/CreationQuotaGauge";
import { Stagger, StaggerItem } from "@/components/ui/motion";

export const metadata: Metadata = { title: "Dashboard — Bazaar" };

/** Month-over-month caption for a stat card.
 *
 *  Two zeros mean the comparison has nothing to say, and saying "+0%" or
 *  inventing "+14%" is how a dashboard stops being worth reading. */
function Delta({
  current,
  previous,
  format = (value: number) => String(value),
}: {
  current: number;
  previous: number;
  format?: (value: number) => string;
}) {
  if (current === 0 && previous === 0) {
    return <span className="text-caption text-muted-gray">No activity yet</span>;
  }

  const change = current - previous;
  const percent = previous > 0 ? Math.round((change / previous) * 100) : null;
  const sign = change >= 0 ? "+" : "−";

  return (
    <span className="flex items-center gap-1.5 text-caption font-medium text-muted-ink">
      <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-ink border border-border">
        {percent === null
          ? `${sign}${format(Math.abs(change))}`
          : `${sign}${Math.abs(percent)}%`}
      </span>
      <span>vs last month</span>
    </span>
  );
}

export default async function DashboardOverviewPage() {
  const overview = await getDashboardOverview();

  if (!overview) return null;

  const { monthly, quota } = overview;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Title & Action Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-display font-semibold tracking-tight text-ink">
            Dashboard <em className="font-serif italic font-normal text-ink">overview</em>
          </h1>
          <p className="text-body-sm text-muted-ink mt-1">
            Track your shirt designs, sales analytics, royalties, and orders in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="btn-ember flex items-center gap-2 px-4 py-2.5 text-body-sm font-semibold text-ink"
          >
            <Plus className="size-4" />
            <span>Create Design</span>
          </Link>
          <Link
            href={overview.handle ? `/creator/${overview.handle}` : "/"}
            className="press-block flex items-center gap-2 rounded-md bg-paper-white px-4 py-2.5 text-body-sm font-semibold text-ink border border-ink hover:bg-accent"
          >
            <span>{overview.handle ? "View Storefront" : "Browse Store"}</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Featured Dark Depth Card (Total Royalties) */}
        <StaggerItem className="h-full">
          <div className="group flex h-full flex-col justify-between rounded-xl bg-depth p-6 text-paper-white border border-ink shadow-[2px_2px_0px_0px_#262626] transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#262626]">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium text-paper-white/80">Total Royalties</span>
              <Link
                href="/dashboard/settings"
                className="flex size-8 items-center justify-center rounded-full bg-paper-white/10 text-paper-white transition-all duration-200 hover:scale-110 hover:bg-lime-sprint hover:text-ink active:scale-95"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <span className="font-sans text-heading-lg font-bold tracking-tight">
                {formatCents(overview.totalRoyaltiesCents)}
              </span>
            </div>
            {monthly.royaltiesCents === 0 && monthly.prevRoyaltiesCents === 0 ? (
              <span className="text-caption text-paper-white/60">
                {formatCents(0)} this month
              </span>
            ) : (
              <div className="flex items-center gap-1.5 text-caption font-medium text-lime-sprint">
                <span className="rounded-md bg-lime-sprint/20 px-2 py-0.5 text-[11px] font-semibold">
                  {formatCents(monthly.royaltiesCents)}
                </span>
                <span className="text-paper-white/70">this month</span>
              </div>
            )}
          </div>
        </StaggerItem>

        {/* Card 2: Designs Claimed */}
        <StaggerItem className="h-full">
          <div className="group flex h-full flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_#262626] hover:border-ink">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium text-muted-ink">Designs Claimed</span>
              <Link
                href="/dashboard/designs"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-paper-white text-ink transition-all duration-200 hover:scale-110 hover:bg-ink hover:text-paper-white active:scale-95"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <span className="font-sans text-heading-lg font-bold tracking-tight text-ink">
                {overview.claimedCount}
              </span>
            </div>
            <Delta current={monthly.claims} previous={monthly.prevClaims} />
          </div>
        </StaggerItem>

        {/* Card 3: Orders Placed */}
        <StaggerItem className="h-full">
          <div className="group flex h-full flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_#262626] hover:border-ink">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium text-muted-ink">Orders Placed</span>
              <Link
                href="/dashboard/orders"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-paper-white text-ink transition-all duration-200 hover:scale-110 hover:bg-ink hover:text-paper-white active:scale-95"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <span className="font-sans text-heading-lg font-bold tracking-tight text-ink">
                {overview.orderCount}
              </span>
            </div>
            <Delta current={monthly.orders} previous={monthly.prevOrders} />
          </div>
        </StaggerItem>

        {/* Card 4: Pending Payout */}
        <StaggerItem className="h-full">
          <div className="group flex h-full flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_#262626] hover:border-ink">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium text-muted-ink">Pending Payout</span>
              <Link
                href="/dashboard/settings"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-paper-white text-ink transition-all duration-200 hover:scale-110 hover:bg-ink hover:text-paper-white active:scale-95"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <span className="font-sans text-heading-lg font-bold tracking-tight text-ink">
                {formatCents(overview.pendingRoyaltiesCents)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-caption font-medium text-muted-gray">
              <span>
                {overview.pendingRoyaltiesCents >= PAYOUT_THRESHOLD_CENTS
                  ? "Ready to pay out"
                  : `Pays out at ${formatCents(PAYOUT_THRESHOLD_CENTS)}`}
              </span>
            </div>
          </div>
        </StaggerItem>
      </Stagger>

      {/* Tier 2: Middle Row Grid (5 + 4 + 3 = 12 Cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Panel 1: Design Analytics (5 Cols) */}
        <div className="lg:col-span-5">
          <DashboardAnalyticsChart data={overview.royaltyByDay} className="h-full" />
        </div>

        {/* Panel 2: Top earning designs (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="group flex h-full flex-col rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_#262626] hover:border-ink">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-sans font-semibold text-heading-sm text-ink">Top Earning</h3>
                <p className="text-caption text-muted-ink mt-0.5">
                  Your designs, by royalties paid
                </p>
              </div>
              <Link
                href="/dashboard/designs"
                className="press-block flex items-center gap-1 rounded-full border border-ink bg-paper-white px-3 py-1 text-caption font-semibold text-ink hover:bg-accent"
              >
                <span>View all</span>
              </Link>
            </div>

            <div className="flex flex-col gap-2.5 mt-3 flex-1">
              {overview.topDesigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
                  <Shirt className="size-8 text-muted-gray mb-2" />
                  <p className="text-caption text-muted-gray">
                    Nothing has earned yet. A design starts earning the moment
                    someone orders it printed.
                  </p>
                  <Link href="/create" className="mt-3 text-caption font-semibold text-ink underline">
                    Start creating
                  </Link>
                </div>
              ) : (
                overview.topDesigns.map((design, i) => (
                  <Link
                    key={design.id}
                    href={`/design/${design.id}`}
                    className="group/item flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-border hover:bg-accent/70 transition-all duration-150"
                  >
                    {/* Rank badge */}
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      i === 0 ? "bg-lime-sprint text-ink border border-ink" :
                      i === 1 ? "bg-ink text-paper-white" :
                      "bg-accent text-muted-ink border border-border"
                    }`}>
                      {i + 1}
                    </span>
                    {/* Thumbnail */}
                    <div className="relative size-9 rounded-md overflow-hidden bg-accent border border-border shrink-0">
                      {design.imageUrl && (
                        <Image src={design.imageUrl} alt="" fill className="object-cover" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-body-sm font-semibold text-ink">
                        {design.label}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-caption text-muted-gray">
                        {formatCents(design.royaltyCents)} earned
                      </span>
                    </div>
                    {/* Trend */}
                    <TrendingUp className="size-4 text-lime-sprint shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel 3: Creation Studio (3 Cols) */}
        <div className="lg:col-span-3">
          <div className="group flex h-full flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_#262626] hover:border-ink">
            <div>
              <h3 className="font-sans font-semibold text-heading-sm text-ink">Creation Studio</h3>
              <p className="text-caption text-muted-ink mt-0.5">
                {quota.total - quota.used > 0
                  ? `${quota.total - quota.used} generations left today`
                  : "Quota spent — resets 24h after each run"}
              </p>
            </div>

            <CreationQuotaGauge used={quota.used} total={quota.total} />

            <Link
              href="/create"
              className="btn-ember flex items-center justify-center gap-2 px-4 py-3 text-body-sm font-semibold text-ink"
            >
              <Sparkles className="size-4" />
              <span>Start Creation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 3: Bottom Row Grid (7 + 5 = 12 Cols).
          The third panel here used to be a second AI-quota card, showing a
          hardcoded 18/20 next to the Creation Studio's hardcoded 2/20 — two
          fabricated numbers disagreeing about the same real quota. The real
          one lives in Creation Studio above. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Panel 1: Recent Activity Log (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="group flex h-full flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_#262626] hover:border-ink">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-sans font-semibold text-heading-sm text-ink">Recent Activity</h3>
              <Link
                href="/dashboard/designs"
                className="text-caption font-semibold text-ink hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="flex flex-col gap-3.5 my-2">
              {overview.recentActivity.length === 0 ? (
                <p className="text-caption text-muted-gray py-6 text-center">
                  No recent activity logged yet.
                </p>
              ) : (
                overview.recentActivity.slice(0, 4).map((item) => (
                  <div key={item.id} className="group/item flex items-center justify-between gap-3 p-1.5 rounded-lg border border-transparent hover:border-border hover:bg-accent/60 transition-all duration-150">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.designImageUrl ? (
                        <div className="relative size-9 rounded-md overflow-hidden border border-border shrink-0 transition-transform duration-200 group-hover/item:scale-105">
                          <Image
                            src={item.designImageUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-md bg-accent border border-border text-ink shrink-0">
                          <Shirt className="size-4" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate text-body-sm font-semibold text-ink">{item.label}</span>
                        <span className="text-caption text-muted-gray">
                          {formatDistanceToNowStrict(new Date(item.occurredAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-mint-wash border border-mint-edge px-2.5 py-0.5 text-[11px] font-semibold text-ink transition-transform duration-150 group-hover/item:scale-105">
                      {item.type === "royalty" ? "Earned" : "Completed"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: Payout progress (5 Cols) */}
        <div className="lg:col-span-5">
          <RoyaltyGoalGauge
            pendingCents={overview.pendingRoyaltiesCents}
            thresholdCents={PAYOUT_THRESHOLD_CENTS}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
