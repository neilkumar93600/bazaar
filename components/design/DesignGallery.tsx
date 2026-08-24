"use client"

import { useState } from "react"
import Image from "next/image"

import type { ColourMockup } from "@/lib/printify/mockups"
import { toneForColourName } from "@/lib/printify/tones"
import { cn } from "@/lib/utils"
import { ShirtMockup } from "@/components/shared/ShirtMockup"

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
  alt,
  colourMockups = [],
  featuredVariantId,
  selectedColour: controlledColour,
  onSelectColour,
  showArt: controlledShowArt,
  onToggleArt,
}: {
  imageUrl: string
  mockupUrl: string | null
  alt: string
  /** One real product photo per garment colour, in catalogue order. Empty until
   *  the design has a Printify product. */
  colourMockups?: ColourMockup[]
  /** The maker's colour. */
  featuredVariantId?: number | null
  selectedColour?: string
  onSelectColour?: (colour: string) => void
  showArt?: boolean
  onToggleArt?: (show: boolean) => void
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

  const offered = colourMockups.filter(
    (option) => !broken.includes(option.colour)
  )
  const selected =
    offered.find((option) => option.colour.toLowerCase() === colour.toLowerCase()) ??
    offered[0] ??
    null
  const shirt = selected?.url ?? mockupUrl

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
            <Image
              src={shirt}
              alt={`${alt} - ${colour} shirt`}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              priority
              onError={() => {
                if (selected) {
                  setBroken((current) => [...current, selected.colour])
                }
              }}
              className="object-contain transition-all duration-300"
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
