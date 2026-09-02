"use client"

import { useState } from "react"
import Image from "next/image"

import type { ColourMockup } from "@/lib/printify/mockups"
import { toneForColourName } from "@/lib/printify/tones"
import { cn } from "@/lib/utils"
import { ShirtMockup } from "@/components/shared/ShirtMockup"
import { GridReveal } from "@/components/ui/grid-reveal"

/** The design's media: the printed shirt in every colour it is sold in, and the
 *  flat artwork.
 *
 *  The colour row is the point. The page used to show one photo, in whichever
 *  colour the maker happened to pick, with no way to see any other — so a buyer
 *  could not tell the design was available on eleven shirts. Printify renders
 *  all of them at product-creation time; `colourMockups` re-points the stored
 *  URL at each colour, so this costs no extra request.
 *
 *  Without a product (a Printify sync that never landed) there are no photos at
 *  all and the drawn tee stands in, as it does on the cards.
 */
export function DesignGallery({
  imageUrl,
  mockupUrl,
  backMockupUrl = null,
  alt,
  colourMockups = [],
  backColourMockups = [],
  featuredVariantId,
  selectedColour: controlledColour,
  onSelectColour,
  showArt: controlledShowArt,
  onToggleArt,
  side: controlledSide,
}: {
  imageUrl: string
  mockupUrl: string | null
  /** The back-print photo. Populated once the product is synced — its presence
   *  is what turns the Front/Back switch on. */
  backMockupUrl?: string | null
  alt: string
  /** One real product photo per garment colour, in catalogue order. Empty until
   *  the design has a Printify product. */
  colourMockups?: ColourMockup[]
  /** Same, for the back print. */
  backColourMockups?: ColourMockup[]
  /** The maker's colour. */
  featuredVariantId?: number | null
  selectedColour?: string
  onSelectColour?: (colour: string) => void
  showArt?: boolean
  onToggleArt?: (show: boolean) => void
  /** Which print side is on screen. The switch itself lives in
   *  DesignDetailPanel, above the colour section — this only reads it, so the
   *  two panes never disagree about which photo is showing. Uncontrolled
   *  callers (none currently) stay on "front". */
  side?: "front" | "back"
}) {
  const [internalColour, setInternalColour] = useState(
    () =>
      colourMockups.find((option) => option.variantId === featuredVariantId)
        ?.colour ??
      colourMockups[0]?.colour ??
      "Black"
  )
  const [internalShowArt, setInternalShowArt] = useState(false)
  const [broken, setBroken] = useState<string[]>([])

  const colour = controlledColour ?? internalColour
  const setColour = onSelectColour ?? setInternalColour
  const showArt = controlledShowArt ?? internalShowArt
  const setShowArt = onToggleArt ?? setInternalShowArt
  const side = controlledSide ?? "front"

  const activeMockupUrl = side === "back" ? backMockupUrl : mockupUrl
  const activeColourMockups = side === "back" ? backColourMockups : colourMockups

  const offered = activeColourMockups.filter(
    (option) => !broken.includes(`${side}:${option.colour}`)
  )
  const selected =
    offered.find((option) => option.colour.toLowerCase() === colour.toLowerCase()) ??
    offered[0] ??
    null
  const shirt = selected?.url ?? activeMockupUrl

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Feature Mockup / Artwork Card with instant zero-lag pre-rendered layers */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink bg-card shadow-[var(--shadow-xl-2)] transition-all duration-300",
          showArt && "sm:aspect-square"
        )}
      >
        {/* 1. Flat Artwork Layer (Pre-rendered & pre-cached with priority for 0ms lag) */}
        <div
          className={cn(
            "absolute inset-0 p-4 transition-opacity duration-300",
            showArt
              ? "opacity-100 z-10 pointer-events-auto"
              : "opacity-0 z-0 pointer-events-none"
          )}
        >
          <Image
            src={imageUrl}
            alt={`${alt} - artwork`}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            priority
            className="object-contain p-2"
          />
        </div>

        {/* 2. Shirt Mockup / Product Photo Layer */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            !showArt
              ? "opacity-100 z-10 pointer-events-auto"
              : "opacity-0 z-0 pointer-events-none"
          )}
        >
          {shirt ? (
            // A Printify mockup is a remote fetch, not our own storage — this is
            // the one image on the page slow enough to be worth covering for.
            // Keyed by `${side}:${shirt}` so the reveal replays for a genuinely
            // new photo but not for a colour/side already in the browser cache.
            <GridReveal
              key={`${side}:${shirt}`}
              src={shirt}
              alt={`${alt} - ${colour} shirt, ${side}`}
              aspect={showArt ? 1 : 4 / 5}
              className="absolute inset-0 h-full w-full rounded-none border-0"
              onError={() => {
                if (selected) {
                  setBroken((current) => [...current, `${side}:${selected.colour}`])
                }
              }}
            />
          ) : (
            <ShirtMockup
              imageUrl={imageUrl}
              tone={toneForColourName(colour) ?? undefined}
              priority
              sizes="(min-width: 1024px) 380px, 50vw"
            />
          )}
        </div>
      </div>

      {/* Quick View Switcher Thumbnails */}
      <div className="flex items-center gap-3">
        <Thumb
          src={shirt ?? imageUrl}
          label="Shirt"
          active={!showArt}
          onClick={() => setShowArt(false)}
        />
        <Thumb
          src={imageUrl}
          label="Art"
          active={showArt}
          onClick={() => setShowArt(true)}
        />
      </div>
    </div>
  )
}

function Thumb({
  src,
  label,
  active,
  onClick,
}: {
  src: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative aspect-[4/5] w-16 overflow-hidden rounded-lg border transition-all cursor-pointer",
        active
          ? "border-ink ring-2 ring-ink/30 opacity-100 shadow-[var(--shadow-hard-half)] scale-105"
          : "border-border opacity-70 hover:border-ink hover:opacity-100"
      )}
    >
      <Image src={src} alt={label} fill sizes="64px" className="object-cover" />
      <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[10px] font-medium text-paper-white">
        {label}
      </span>
    </button>
  )
}
