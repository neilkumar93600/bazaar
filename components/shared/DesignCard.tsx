"use client"

import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"

import { cn } from "@/lib/utils"
import { useDesignDialog } from "@/components/design/DesignDialogProvider"
import { ShirtMockup } from "@/components/shared/ShirtMockup"

/** The one design card. Home feed, /shop and creator storefronts all render
 *  this — each data module maps its rows into this shape rather than growing
 *  its own card variant. */
export type DesignCardData = {
  id: string
  imageUrl: string
  /** Printify's photo of this design on a real garment, once it has one. Null
   *  for everything unclaimed — products are only minted on claim — which is
   *  why the drawn mockup isn't going anywhere. */
  mockupUrl: string | null
  isClaimed: boolean
  /** Null means free. */
  priceCents: number | null
  /** The maker's idea, and the only per-design label that exists. */
  prompt: string | null
  isPromptHidden?: boolean | null
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
  aspectClassName = "aspect-[4/5]",
  frameClassName,
}: {
  design: DesignCardData
  /** Drives the entrance stagger in grids. Omit inside marquees. */
  index?: number
  priority?: boolean
  className?: string
  /** Overridable so an editorial grid can mix portrait, square and landscape
   *  crops instead of tiling one ratio. Strips and marquees keep the default. */
  aspectClassName?: string
  /** Extra classes for the framed image itself, not the whole card. The caption
   *  sits outside the frame, so interaction treatments like `press-block` have
   *  to land here or they'd outline the text too. */
  frameClassName?: string
}) {
  const dialog = useDesignDialog()

  const promptDisplay = design.isPromptHidden
    ? "Prompt hidden by creator"
    : design.prompt
      ? design.prompt
      : design.vibeName
        ? `${design.vibeName} Design`
        : "Prompt not available"

  return (
    <Link
      href={`/design/${design.id}`}
      onClick={(e) => {
        // Plain left-click opens the dialog in place, no URL change. Any
        // modified click (new tab, new window, save-as, etc.) falls through
        // to the real link so /design/[id] still works for those — as does a
        // card rendered outside the provider, which has no dialog to open.
        if (!dialog) return
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        dialog.openDesign(design.id)
      }}
      className={cn(
        "group/card block outline-none transition-transform duration-300 hover:-translate-y-1",
        index !== undefined && "animate-card-rise",
        index !== undefined &&
          index < STAGGER_CLASSES.length &&
          STAGGER_CLASSES[index],
        className
      )}
    >
      <div
        className={cn(
          "glass-surface glass-surface-interactive relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover/card:shadow-xl group-hover/card:border-primary/40",
          aspectClassName,
          frameClassName
        )}
      >
        {/* The card sells a shirt, so it shows a shirt: the real product photo
            where one exists, the drawn stand-in everywhere else. */}
        {design.mockupUrl ? (
          <Image
            src={design.mockupUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 45vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        ) : (
          <ShirtMockup imageUrl={design.imageUrl} priority={priority} />
        )}

        {design.isClaimed ? (
          // Status Pill Badge — mint wash inside a mint edge, ink label.
          <span className="absolute top-3 left-3 rounded-full border border-success/30 bg-mint-wash px-2.5 py-0.5 text-caption font-medium text-foreground backdrop-blur-md shadow-sm">
            Claimed
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full bg-sunset-sweep px-2.5 py-1 text-caption font-medium text-background shadow-sm">
            1 of 1
          </span>
        )}

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pitch/90 via-pitch/30 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
        />
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
          <span
            className={
              design.isClaimed
                ? "glass-panel rounded-lg border border-border/60 px-4 py-2 text-body-sm font-medium text-foreground backdrop-blur-md shadow-md"
                : "btn-ember px-4 py-2 text-body-sm font-medium shadow-md"
            }
          >
            {design.isClaimed ? "View design" : "Claim it"}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        {/* One line, clipped — a prompt is a sentence, not a headline */}
        <span
          className={cn(
            "truncate text-body font-medium transition-colors group-hover/card:text-primary",
            design.isPromptHidden
              ? "italic text-muted-foreground"
              : !design.prompt
                ? "text-muted-foreground"
                : "text-foreground"
          )}
          title={promptDisplay}
        >
          {promptDisplay}
        </span>
        <span className="shrink-0 font-mono text-body-sm font-semibold text-gold-leaf">
          {design.priceCents === null
            ? "Free"
            : priceFormatter.format(design.priceCents / 100)}
        </span>
      </div>

      <p className="mt-1 truncate text-body-sm text-muted-foreground">
        {[
          design.vibeName,
          design.isClaimed
            ? design.claimantHandle
              ? `Claimed by @${design.claimantHandle}`
              : "Claimed"
            : `Unclaimed · ${formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  )
}
