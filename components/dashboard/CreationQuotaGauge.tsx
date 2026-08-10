"use client";

import { cn } from "@/lib/utils";

type CreationQuotaGaugeProps = {
  used: number;
  total: number;
  className?: string;
};

export function CreationQuotaGauge({
  used,
  total,
  className,
}: CreationQuotaGaugeProps) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  // Arc circumference for the semi-circle path ≈ 201
  const ARC_LEN = 201;

  return (
    <div className={cn("relative flex flex-col items-center justify-center my-2", className)}>
      <svg className="w-48 h-28" viewBox="0 0 160 90">
        <defs>
          <pattern
            id="quota-hatch"
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
          stroke="url(#quota-hatch)"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Lime Sprint Used Arc */}
        <path
          d="M 16 80 A 64 64 0 0 1 144 80"
          fill="none"
          stroke="#a3e635"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={ARC_LEN - pct * ARC_LEN}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute bottom-1 flex flex-col items-center justify-center text-center">
        <span className="font-sans text-heading-lg font-bold tracking-tight text-ink">
          {used} / {total}
        </span>
        <span className="text-caption font-medium text-muted-ink mt-0.5">
          credits used today
        </span>
      </div>
    </div>
  );
}
