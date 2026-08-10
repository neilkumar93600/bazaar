"use client"

import { useState, useTransition } from "react"

import {
  listDesign,
  delistDesign,
  type GarmentConfig,
} from "@/app/dashboard/designs/actions"
import type { GarmentOption } from "@/app/dashboard/designs/garment-options"
import {
  PLACEMENTS,
  PLACEMENT_LABELS,
  type Placement,
} from "@/lib/printify/print-areas"
import Image from "next/image"
import { toneForColourName } from "@/lib/printify/tones"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** List / relist / delist for one design, plus the garment it gets printed on.
 *
 *  Validation runs server-side in `listDesign` and the error comes back as a
 *  string — the client does not re-implement the rule, so there is only one
 *  copy of it to be wrong. */
export function ListingForm({
  designId,
  imageUrl,
  isListed,
  priceCents,
  initialHidePrompt = false,
  garmentOptions,
  frozen,
  initialConfig,
  onSuccess,
  hideInlineThumbnail = false,
}: {
  designId: string
  /** The artwork, for the live preview. */
  imageUrl: string
  isListed: boolean
  /** Pre-fills the box on a relist: the maker confirms the old number rather
   *  than silently inheriting one they set weeks ago. */
  priceCents: number | null
  initialHidePrompt?: boolean
  /** Empty when Printify isn't configured — the garment section is then hidden
   *  rather than offering choices that could never be minted. */
  garmentOptions: GarmentOption[]
  /** True once a Printify product exists. Re-minting would orphan it, so the
   *  garment section renders read-only and the action is sent a null config. */
  frozen: boolean
  initialConfig: {
    garmentSlug: string | null
    variantId: number | null
    placement: Placement | null
  }
  onSuccess?: () => void
  hideInlineThumbnail?: boolean
}) {
  const [free, setFree] = useState(priceCents === null && isListed)
  const [dollars, setDollars] = useState(
    priceCents === null ? "" : (priceCents / 100).toString()
  )
  const [hidePrompt, setHidePrompt] = useState(initialHidePrompt)

  const [garmentSlug, setGarmentSlug] = useState(
    () => initialConfig.garmentSlug ?? garmentOptions[0]?.slug ?? ""
  )
  const [placement, setPlacement] = useState<Placement>(
    () => initialConfig.placement ?? "front"
  )

  const garment = garmentOptions.find((option) => option.slug === garmentSlug)

  const [variantId, setVariantId] = useState<number | null>(
    () => initialConfig.variantId ?? garmentOptions[0]?.colours[0]?.variantId ?? null
  )

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const colour =
    garment?.colours.find((option) => option.variantId === variantId)?.colour ??
    null

  const priceFieldId = `price-${designId}`
  const freeFieldId = `free-${designId}`
  const hidePromptFieldId = `hide-prompt-${designId}`

  const showGarment = garmentOptions.length > 0

  function config(): GarmentConfig | null {
    // A minted product's garment cannot change, so there is nothing to send.
    if (frozen || !garment || variantId === null) return null
    return { garmentSlug: garment.slug, variantId, placement }
  }

  return (
    <div className="flex flex-col gap-4">
      {showGarment && (
        <div className="flex gap-4 items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {frozen ? (
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-3">
                <span className="text-body-sm font-semibold text-foreground">
                  {garment?.label ?? "Garment"}
                  {colour ? ` · ${colour}` : ""} ·{" "}
                  {PLACEMENT_LABELS[placement]}
                </span>
                <span className="text-caption text-muted-foreground">
                  Fixed — the product is already made.
                </span>
              </div>
            ) : (
              <>
                {garmentOptions.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Garment</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {garmentOptions.map((option) => (
                        <button
                          key={option.slug}
                          type="button"
                          aria-pressed={option.slug === garmentSlug}
                          disabled={isPending}
                          onClick={() => {
                            setGarmentSlug(option.slug)
                            setVariantId(option.colours[0]?.variantId ?? null)
                          }}
                          className={cn(
                            "rounded-full border px-3 py-1 text-caption font-medium transition-all disabled:opacity-50",
                            option.slug === garmentSlug
                              ? "border-primary bg-primary text-primary-foreground shadow-xs"
                              : "border-border bg-secondary text-foreground hover:bg-accent"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {garment && garment.colours.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                      Colour{colour ? ` · ${colour}` : ""}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {garment.colours.map((option) => {
                        const swatch = toneForColourName(option.colour)
                        const active = option.variantId === variantId
                        return (
                          <button
                            key={option.variantId}
                            type="button"
                            aria-label={option.colour}
                            aria-pressed={active}
                            title={option.colour}
                            disabled={isPending}
                            onClick={() => setVariantId(option.variantId)}
                            style={
                              swatch ? { backgroundColor: swatch.body } : undefined
                            }
                            className={cn(
                              "size-6 rounded-full border transition disabled:opacity-50",
                              active
                                ? "border-primary ring-2 ring-primary/40 scale-110"
                                : "border-border hover:border-primary/60",
                              // An unmapped colour has no swatch to paint, so it
                              // shows its initial rather than a blank hole.
                              !swatch &&
                                "bg-secondary text-caption text-muted-foreground"
                            )}
                          >
                            {swatch ? "" : option.colour.slice(0, 1)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Print Placement</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEMENTS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={option === placement}
                        disabled={isPending}
                        onClick={() => setPlacement(option)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-caption font-medium transition-all disabled:opacity-50",
                          option === placement
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border bg-secondary text-foreground hover:bg-accent"
                        )}
                      >
                        {PLACEMENT_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {!hideInlineThumbnail && (
            <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Checkbox
            id={freeFieldId}
            checked={free}
            onCheckedChange={(checked) => setFree(checked === true)}
            disabled={isPending}
          />
          <Label htmlFor={freeFieldId} className="text-body-sm font-medium text-foreground cursor-pointer select-none">
            Free to claim
          </Label>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id={hidePromptFieldId}
            checked={hidePrompt}
            onCheckedChange={(checked) => setHidePrompt(checked === true)}
            disabled={isPending}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={hidePromptFieldId} className="text-body-sm font-medium text-foreground cursor-pointer select-none">
              Hide prompt publicly
            </Label>
            <span className="text-caption text-muted-foreground">
              Shows &quot;Prompt hidden by creator&quot; in the bazaar.
            </span>
          </div>
        </div>
      </div>

      {!free && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={priceFieldId} className="text-body-sm font-medium text-foreground">
            Listing Price
          </Label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-body-sm font-semibold text-muted-foreground">$</span>
            <Input
              id={priceFieldId}
              inputMode="decimal"
              placeholder="29.00"
              value={dollars}
              onChange={(event) => setDollars(event.target.value)}
              disabled={isPending}
              className="pl-7 bg-background font-mono text-body-sm font-semibold text-foreground border-border focus:border-primary"
            />
          </div>
        </div>
      )}

      {error && <p className="text-caption text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ember"
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await listDesign(designId, config(), free, dollars, hidePrompt)
              if (result.error) {
                setError(result.error)
              } else {
                onSuccess?.()
              }
            })
          }}
        >
          {isListed ? "Update listing" : "Make it live"}
        </Button>

        {isListed && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await delistDesign(designId)
                if (result.error) {
                  setError(result.error)
                } else {
                  onSuccess?.()
                }
              })
            }}
          >
            Delist
          </Button>
        )}
      </div>
    </div>
  )
}
