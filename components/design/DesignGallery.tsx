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
  colourMockups,
  featuredVariantId,
}: {
  imageUrl: string
  mockupUrl: string | null
  alt: string
  /** One real product photo per garment colour, in catalogue order. Empty until
   *  the design has a Printify product. */
  colourMockups: ColourMockup[]
  /** The maker's colour. The stored `mockupUrl` is already this colour and the
   *  order form opens on it, so the gallery has to as well — otherwise the hero
   *  shows Black while the buyer's basket says Maroon. */
  featuredVariantId: number | null
}) {
  const [colour, setColour] = useState(
    () =>
      colourMockups.find((option) => option.variantId === featuredVariantId)
        ?.colour ??
      colourMockups[0]?.colour ??
      ""
  )
  const [showArt, setShowArt] = useState(false)
  /** A colour whose photo 404s — which happens when the garment's curated
   *  colour list grows past what the product was minted with. Dropped from the
   *  row rather than left as a swatch that shows the wrong shirt. */
  const [broken, setBroken] = useState<string[]>([])

  const offered = colourMockups.filter(
    (option) => !broken.includes(option.colour)
  )
  const selected =
    offered.find((option) => option.colour === colour) ?? offered[0] ?? null
  const shirt = selected?.url ?? mockupUrl

  return (
    // No width cap: the page gives this half the grid, which is already the
    // right size for it.
    <div className="flex w-full flex-col gap-3">
      {/* Feature Mockup Card: 8px radius, 1px solid ink border, 2px hard offset
          shadow. The drawn tee keeps the 4:5 frame at every width — its print
          overlay is positioned against a 10:11 box, and a squarer frame
          letterboxes the SVG while the overlay stays put, sliding the artwork
          off the chest. */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-ink bg-card shadow-[var(--shadow-xl-2)]",
          (showArt || shirt) && "sm:aspect-square"
        )}
      >
        {showArt || shirt ? (
          <Image
            src={showArt ? imageUrl : shirt!}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            priority
            onError={() => {
              if (!showArt && selected) {
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
            sizes="(min-width: 1024px) 260px, 40vw"
          />
        )}
      </div>

      {offered.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-caption text-muted-ink">
            Shirt colour{!showArt && selected ? ` · ${selected.colour}` : ""}
          </span>
          {/* Wraps rather than scrolls: eleven swatches over two rows on a
              phone is shorter than a scroller the buyer has to discover. */}
          <div className="flex flex-wrap gap-2">
            {offered.map((option) => {
              const swatch = toneForColourName(option.colour)
              const active = !showArt && option.colour === selected?.colour
              return (
                <button
                  key={option.colour}
                  type="button"
                  aria-label={option.colour}
                  aria-pressed={active}
                  title={option.colour}
                  onClick={() => {
                    setColour(option.colour)
                    setShowArt(false)
                  }}
                  style={swatch ? { backgroundColor: swatch.body } : undefined}
                  className={cn(
                    // 36px at every width. A swatch is a thumb target before it
                    // is a dot, and 768px is a touch viewport too.
                    "size-9 rounded-full border transition",
                    active
                      ? "border-ink ring-2 ring-ink/30"
                      : "border-border hover:border-ink",
                    !swatch && "bg-secondary text-caption text-muted-foreground"
                  )}
                >
                  {swatch ? "" : option.colour.slice(0, 1)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* The artwork is always reachable: it is what an unclaimed design
          actually sells, and gating this row on a product photo hid it on every
          design whose Printify sync never landed. */}
      <div className="flex items-center gap-3">
        {shirt && (
          <Thumb
            src={shirt}
            label="Shirt"
            active={!showArt}
            onClick={() => setShowArt(false)}
          />
        )}
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
        "group relative aspect-[4/5] w-16 overflow-hidden rounded-lg border transition-all",
        active
          ? "border-ink opacity-100 shadow-[var(--shadow-hard-half)]"
          : "border-border opacity-70 hover:border-ink hover:opacity-100"
      )}
    >
      <Image src={src} alt={label} fill sizes="64px" className="object-cover" />
      {/* Off the type scale on purpose: 14px caption on a 64px thumb wraps.
          This is chrome on a control, not copy. */}
      <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[10px] font-medium text-paper-white">
        {label}
      </span>
    </button>
  )
}
