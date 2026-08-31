import Link from "next/link"
import { format, formatDistanceToNowStrict } from "date-fns"

import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import { designLabel, formatListingPrice, cn } from "@/lib/utils"
import { toneForColourName } from "@/lib/printify/tones"
import { BuyForm } from "@/components/design/BuyForm"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

/** The transactional column: name, price, buy/order control, then the detail
 *  accordions. Shared by the full design page and the card popup so "buy"
 *  behaves identically in both — one code path, not two that can drift. */
export function DesignDetailPanel({
  design,
  orderOptions,
  availableColours = [],
  selectedColour = "Black",
  onSelectColour,
  showArt = false,
  onToggleArt,
  side = "front",
  onChangeSide,
  isSignedIn,
  viewerEmail,
  viewerDisplayName,
}: {
  design: DesignDetail
  orderOptions?: OrderOptions
  availableColours?: string[]
  selectedColour?: string
  onSelectColour?: (colour: string) => void
  showArt?: boolean
  onToggleArt?: (show: boolean) => void
  /** Which print side the gallery is showing. Only rendered as a switch when
   *  the design actually has a back photo (`placement: "both"`) — a front- or
   *  back-only design has nothing to toggle to. */
  side?: "front" | "back"
  onChangeSide?: (side: "front" | "back") => void
  isSignedIn: boolean
  viewerEmail: string
  viewerDisplayName: string
}) {
  const title = designLabel(design)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 text-heading md:text-heading-lg font-semibold break-words text-foreground">
            <FormattedTitle title={title} />
          </h1>
          {design.isClaimed ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-3 py-1 text-caption font-medium text-ink">
              <span className="size-1.5 rounded-full bg-[#7ee2b8]" aria-hidden />
              Claimed
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-ink bg-transparent px-3 py-1 text-caption font-medium tracking-[0.08em] text-ink uppercase">
              1 of 1
            </span>
          )}
        </div>
        <p className="text-body text-muted-ink">
          {design.vibeName ? `${design.vibeName} · ` : ""}
          Minted{" "}
          {formatDistanceToNowStrict(new Date(design.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <span className="font-mono text-heading text-foreground font-semibold">
        {formatListingPrice(design.priceCents)}
      </span>

      {/* Print side switch — only a `both`-placement design has a back photo
          to switch to. Sits above the colour section: colour and side are
          independent choices, but side is the one that decides which photo
          the colour swatches below re-point. */}
      {design.backMockupUrl && (
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <span className="text-body-sm font-semibold text-foreground">
            Print side · {side === "back" ? "Back" : "Front"}
          </span>
          <div className="flex items-center gap-1 text-caption font-medium text-muted-ink">
            {(["front", "back"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChangeSide?.(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-caption capitalize transition cursor-pointer",
                  side === option
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Garment Colour & Preview controls on the right side */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-semibold text-foreground">
            Shirt Colour{selectedColour && !showArt ? ` · ${selectedColour}` : ""}
          </span>
          <div className="flex items-center gap-1 text-caption font-medium text-muted-ink">
            <span>View:</span>
            <button
              type="button"
              onClick={() => onToggleArt?.(false)}
              className={cn(
                "rounded-md px-2.5 py-1 text-caption transition cursor-pointer",
                !showArt
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Shirt
            </button>
            <button
              type="button"
              onClick={() => onToggleArt?.(true)}
              className={cn(
                "rounded-md px-2.5 py-1 text-caption transition cursor-pointer",
                showArt
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Art
            </button>
          </div>
        </div>

        {availableColours.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {availableColours.map((col) => {
              const swatch = toneForColourName(col)
              const active = !showArt && col.toLowerCase() === selectedColour?.toLowerCase()
              return (
                <button
                  key={col}
                  type="button"
                  aria-label={col}
                  aria-pressed={active}
                  title={col}
                  onClick={() => onSelectColour?.(col)}
                  style={swatch ? { backgroundColor: swatch.body } : undefined}
                  className={cn(
                    "size-8 rounded-full border transition cursor-pointer",
                    active
                      ? "border-primary ring-2 ring-primary/40 scale-110 shadow-sm"
                      : "border-border hover:border-primary/60 hover:scale-105",
                    !swatch && "bg-secondary text-caption text-muted-foreground"
                  )}
                >
                  {swatch ? "" : col.slice(0, 1)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {design.isClaimed ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-4">
          <div className="flex items-center gap-2 text-body-sm font-semibold text-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            1-of-1 Artwork Claimed
          </div>
          {design.claimantHandle ? (
            <p className="text-body-sm text-muted-ink">
              Owned exclusively by{" "}
              <Link
                href={`/creator/${design.claimantHandle}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                @{design.claimantHandle}
              </Link>
              .
            </p>
          ) : (
            <p className="text-body-sm text-muted-ink">
              The permanent 1-of-1 rights to this artwork are spoken for.
            </p>
          )}
        </div>
      ) : (
        <BuyForm
          designId={design.id}
          priceCents={design.priceCents}
          defaultName={viewerDisplayName}
          defaultEmail={viewerEmail}
          isGuest={!isSignedIn}
        />
      )}

      <Accordion defaultValue={["details"]} className="mt-2">
        <AccordionItem value="details">
          <AccordionTrigger className="text-body font-semibold">
            Design details
          </AccordionTrigger>
          <AccordionContent>
            <DetailRow label="Edition" value="1 of 1 — never generated again" />
            <DetailRow
              label="Status"
              value={
                design.isClaimed
                  ? design.claimantHandle
                    ? `Claimed by @${design.claimantHandle}`
                    : "Claimed"
                  : "Unclaimed"
              }
            />
            {design.vibeName && (
              <DetailRow label="Vibe" value={design.vibeName} />
            )}
            {design.quote && (
              <DetailRow label="Printed line" value={design.quote} />
            )}
            <DetailRow
              label="Minted"
              value={format(new Date(design.createdAt), "d MMMM yyyy")}
            />
            <DetailRow
              label="File"
              value="Flat artwork PNG, transparent, print-ready"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="included">
          <AccordionTrigger className="text-body font-semibold">
            What you get
          </AccordionTrigger>
          <AccordionContent>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-body-sm text-muted-ink">
              <li>
                The artwork file itself, emailed on purchase — the flat
                design, not a photo of a shirt.
              </li>
              <li>Permanent ownership of a 1-of-1. Nobody else can claim it.</li>
              <li>A storefront of your own, with this design on it.</li>
              <li>A royalty on every printed order of it, forever.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

/** Splits multi-word headlines to give the final word Fraunces italic emphasis
 *  as required by docs/DESIGN.md. */
function FormattedTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) {
    return <>{title}</>
  }
  const main = words.slice(0, -1).join(" ")
  const last = words[words.length - 1]
  return (
    <>
      {main} <em className="font-serif font-normal italic">{last}</em>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-0">
      <span className="shrink-0 text-body-sm font-medium text-ink">
        {label}
      </span>
      <span className="text-right text-body-sm text-muted-ink">{value}</span>
    </div>
  )
}
