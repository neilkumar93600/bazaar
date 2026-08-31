"use client"

import { useState } from "react"
import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import type { ColourMockup } from "@/lib/printify/mockups"
import { designLabel } from "@/lib/utils"
import { DesignGallery } from "@/components/design/DesignGallery"
import { DesignDetailPanel } from "@/components/design/DesignDetailPanel"
import { CreatorCard } from "@/components/design/CreatorCard"

export const DEFAULT_COLOUR_OPTIONS = [
  "Black",
  "White",
  "Navy",
  "Sport Grey",
  "Maroon",
  "Forest Green",
  "Gold",
  "Orange",
  "Light Blue",
]

export function DesignView({
  design,
  orderOptions,
  shirtColours,
  backShirtColours = [],
  isSignedIn,
  viewerEmail,
  viewerDisplayName,
  creatorDesignCount,
}: {
  design: DesignDetail
  orderOptions: OrderOptions
  shirtColours: ColourMockup[]
  backShirtColours?: ColourMockup[]
  isSignedIn: boolean
  viewerEmail: string
  viewerDisplayName: string
  creatorDesignCount?: number
}) {
  // Collect available colours from real mockups, order options, or curated default set
  const availableColours: string[] =
    shirtColours.length > 0
      ? shirtColours.map((c) => c.colour)
      : orderOptions?.colours && orderOptions.colours.length > 0
      ? orderOptions.colours.map((c) => c.colour)
      : DEFAULT_COLOUR_OPTIONS

  // Initial colour from featured variant or first available
  const initialColour =
    shirtColours.find((option) => option.variantId === design.featuredVariantId)
      ?.colour ??
    orderOptions?.colours.find((c) => c.variantId === design.featuredVariantId)
      ?.colour ??
    availableColours[0] ??
    "Black"

  const [selectedColour, setSelectedColour] = useState(initialColour)
  const [showArt, setShowArt] = useState(false)
  const [side, setSide] = useState<"front" | "back">("front")

  const title = designLabel(design)

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Split into three grid items, not two flex columns: a mobile buyer
          reads image -> price/colour/buy -> maker/description, so the buy
          button can't sit inside the same block as the stuff that used to
          push it down the page. `order` reshuffles that stack on mobile;
          `lg:order-none` plus explicit col/row-start put it all back for the
          two-column desktop layout, where the maker card and description
          belong under the gallery either way. */}
      <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <DesignGallery
          imageUrl={design.imageUrl}
          mockupUrl={design.mockupUrl}
          backMockupUrl={design.backMockupUrl}
          alt={title}
          colourMockups={shirtColours}
          backColourMockups={backShirtColours}
          featuredVariantId={design.featuredVariantId}
          selectedColour={selectedColour}
          onSelectColour={setSelectedColour}
          showArt={showArt}
          onToggleArt={setShowArt}
          side={side}
        />
      </div>

      {/* Transactional Panel with Colour Selector below pricing */}
      <div className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <DesignDetailPanel
          design={design}
          orderOptions={orderOptions}
          availableColours={availableColours}
          selectedColour={selectedColour}
          onSelectColour={(colour) => {
            setSelectedColour(colour)
            setShowArt(false)
          }}
          showArt={showArt}
          onToggleArt={setShowArt}
          side={side}
          onChangeSide={setSide}
          isSignedIn={isSignedIn}
          viewerEmail={viewerEmail}
          viewerDisplayName={viewerDisplayName}
        />
      </div>

      <div className="order-3 lg:order-none flex flex-col gap-6 lg:col-start-1">
        {design.creator ? (
          <CreatorCard
            creator={design.creator}
            designCount={creatorDesignCount}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 text-body-sm text-muted-ink">
            House stock — no maker attached to this one.
          </div>
        )}

        {design.description && (
          <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <h4 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              About this artwork
            </h4>
            <p className="text-body text-muted-ink leading-relaxed">
              {design.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
