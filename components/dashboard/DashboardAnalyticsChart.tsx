"use client";

import { useState } from "react";
import { cn, formatCents } from "@/lib/utils";

export type RoyaltyDay = { day: string; cents: number };

/** Royalties earned per day over the last week.
 *
 *  Royalties, not views: nothing in this schema counts a view, so there is no
 *  view series to draw. The bars are the real ledger or the panel says there
 *  is nothing yet — it never invents a shape.
 */
export function DashboardAnalyticsChart({
  data,
  className,
}: {
  data: RoyaltyDay[];
  className?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const peak = Math.max(...data.map((d) => d.cents), 0);
  const total = data.reduce((sum, d) => sum + d.cents, 0);

  const bars = data.map((entry) => ({
    ...entry,
    // Against the week's own peak, so one good day doesn't flatten the rest.
    height: peak > 0 ? Math.max((entry.cents / peak) * 100, 4) : 0,
    isPeak: peak > 0 && entry.cents === peak,
  }));

  return (
    <div className={cn("group flex flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_#262626] hover:border-ink", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans text-heading-sm font-semibold text-ink tracking-tight">
            Royalty Activity
          </h3>
          <p className="text-caption text-muted-ink mt-0.5">
            Earned over the last 7 days
          </p>
        </div>
        <span className="font-mono text-body-sm font-semibold text-ink">
          {formatCents(total)}
        </span>
      </div>

      {total === 0 ? (
        <div className="mt-6 flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-center">
          <p className="text-body-sm font-medium text-ink">No royalties this week</p>
          <p className="text-caption text-muted-gray">
            You earn one every time somebody orders a design you own.
          </p>
        </div>
      ) : (
        <div className="relative mt-6 flex h-48 items-end justify-between gap-3 px-2">
          {bars.map((item, index) => {
            const isSelected = activeIdx === index;

            return (
              <div
                key={index}
                onClick={() => setActiveIdx(isSelected ? null : index)}
                className="group relative flex flex-1 flex-col items-center cursor-pointer"
              >
                {isSelected && item.cents > 0 && (
                  <div className="absolute -top-8 z-10 rounded-md border border-ink bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper-white shadow-xs">
                    {formatCents(item.cents)}
                  </div>
                )}

                <div className="relative w-full max-w-[40px] h-40 flex items-end justify-center rounded-lg bg-accent/50 p-1 border border-border/50">
                  {item.cents === 0 ? (
                    <div
                      className="w-full rounded-md border border-rule transition-all duration-300"
                      style={{
                        height: "4%",
                        backgroundImage:
                          "repeating-linear-gradient(-45deg, #e5e5e5, #e5e5e5 4px, transparent 4px, transparent 8px)",
                      }}
                    />
                  ) : item.isPeak ? (
                    <div
                      style={{ height: `${item.height}%` }}
                      className="w-full rounded-md bg-lime-sprint border border-ink shadow-[1px_1px_0px_0px_#262626] transition-all duration-300"
                    />
                  ) : (
                    <div
                      style={{ height: `${item.height}%` }}
                      className="w-full rounded-md bg-ink transition-all duration-300"
                    />
                  )}
                </div>

                <span
                  className={cn(
                    "mt-3 text-caption font-medium transition-colors",
                    isSelected ? "font-semibold text-ink" : "text-muted-gray"
                  )}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
