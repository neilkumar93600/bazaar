"use client";

import { cn, formatCents } from "@/lib/utils";

type RoyaltyGoalGaugeProps = {
  /** Royalties earned but not yet paid out. */
  pendingCents: number;
  /** What has to accumulate before a payout runs — lib/royalty.ts owns it. */
  thresholdCents: number;
  className?: string;
};

/** Progress toward the next payout. Both numbers are real: one is the sum of
 *  the user's unpaid royalty ledger rows, the other is the published
 *  threshold. Nothing here is a target invented to fill an arc. */
export function RoyaltyGoalGauge({
  pendingCents,
  thresholdCents,
  className,
}: RoyaltyGoalGaugeProps) {
  const percentage =
    thresholdCents > 0
      ? Math.min(Math.round((pendingCents / thresholdCents) * 100), 100)
      : 0;

  return (
    <div className={cn("group flex flex-col justify-between rounded-xl bg-card p-6 border border-border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_#262626] hover:border-ink", className)}>
      <div>
        <h3 className="font-sans text-heading-sm font-semibold text-ink tracking-tight">
          Next Payout
        </h3>
        <p className="text-caption text-muted-ink mt-0.5">
          Pending royalties toward the {formatCents(thresholdCents)} threshold
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center my-2">
        <svg className="w-56 h-32" viewBox="0 0 160 90">
          <defs>
            <pattern
              id="arc-hatch"
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#e5e5e5" strokeWidth="2.5" />
            </pattern>
          </defs>

          {/* Hatched Remaining Arc */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="url(#arc-hatch)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Lime Sprint Progress Arc */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="#a3e635"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="201"
            strokeDashoffset={201 - (percentage / 100) * 201}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute bottom-1 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-heading-sm font-bold tracking-tight text-ink">
            {formatCents(pendingCents)}
          </span>
          <span className="text-caption font-medium text-muted-ink mt-0.5">
            of {formatCents(thresholdCents)} pending
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-caption font-medium text-ink">
          <span className="size-2.5 rounded-full bg-lime-sprint border border-ink" />
          <span>Earned ({percentage}%)</span>
        </div>
        <div className="flex items-center gap-1.5 text-caption font-medium text-muted-gray">
          <span className="size-2.5 rounded-full bg-rule" />
          <span>{formatCents(Math.max(thresholdCents - pendingCents, 0))} to go</span>
        </div>
      </div>
    </div>
  );
}
