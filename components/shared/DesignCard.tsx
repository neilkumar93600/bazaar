"use client"

import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"

import { cn } from "@/lib/utils"
import { useDesignDialog } from "@/components/design/DesignDialogProvider"

/** The one design card. Home feed, /shop and creator storefronts all render
 *  this — each data module maps its rows into this shape rather than growing
 *  its own card variant. */
export type DesignCardData = {
  id: string
  imageUrl: string
  isClaimed: boolean
  priceCents: number
  vibeName: string | null
  claimantHandle: string | null
  createdAt: string
}

const STAGGER_CLASSES = Array.from({ length: 14 }, (_, i) => `stagger-${i}`)

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  // Whole dollars unless the price actually has cents — "$29" reads cleaner in
  // a grid than "$29.00", but "$24.50" must not round to "$25".
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function DesignCard({
  design,
  index,
  priority = false,
  className,
}: {
  design: DesignCardData
  /** Drives the entrance stagger in grids. Omit inside marquees. */
  index?: number
  priority?: boolean
  className?: string
}) {
  const { openDesign } = useDesignDialog()

  return (
    <Link
      href={`/design/${design.id}`}
      onClick={(e) => {
        // Plain left-click opens the dialog in place, no URL change. Any
        // modified click (new tab, new window, save-as, etc.) falls through
        // to the real link so /design/[id] still works for those.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        openDesign(design.id)
      }}
      className={cn(
        "group/card block outline-none",
        index !== undefined && "animate-card-rise",
        index !== undefined &&
          index < STAGGER_CLASSES.length &&
          STAGGER_CLASSES[index],
        className
      )}
    >
      <div className="glass-surface glass-surface-interactive relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 45vw"
          priority={priority}
          className="object-cover"
        />

        {design.isClaimed ? (
          <span className="glass-panel absolute top-3 left-3 rounded-full border px-2.5 py-1 text-caption font-medium text-success">
            Claimed
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full bg-sunset-sweep px-2.5 py-1 text-caption font-medium text-background">
            1 of 1
          </span>
        )}

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pitch/85 via-pitch/25 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
        />
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
          <span
            className={
              design.isClaimed
                ? "glass-panel rounded-full border px-4 py-2 text-body-sm font-medium text-foreground"
                : "btn-ember rounded-full px-4 py-2 text-body-sm font-medium"
            }
          >
            {design.isClaimed ? "View design" : "Claim it"}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="truncate text-body font-medium text-foreground">
          {design.vibeName ?? "Unfiled"}
        </span>
        <span className="shrink-0 font-mono text-body-sm text-gold-leaf">
          {priceFormatter.format(design.priceCents / 100)}
        </span>
      </div>
      {/* Branches on isClaimed, not on the handle: a claim whose profile we
          can't resolve (RLS, deleted account) is still a claim, and keying off
          the handle would contradict the badge above. */}
      <p className="mt-1 text-body-sm text-muted-foreground">
        {design.isClaimed
          ? design.claimantHandle
            ? `Claimed by @${design.claimantHandle}`
            : "Claimed"
          : `Unclaimed · ${formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}`}
      </p>
    </Link>
  )
}
