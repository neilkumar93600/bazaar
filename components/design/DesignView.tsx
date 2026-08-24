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
  isSignedIn,
  viewerEmail,
  viewerDisplayName,
  creatorDesignCount,
}: {
  design: DesignDetail
  orderOptions: OrderOptions
  shirtColours: ColourMockup[]
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

  const title = designLabel(design)

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Left Column: Instant-loading Gallery + Creator Card */}
      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
        <DesignGallery
          imageUrl={design.imageUrl}
          mockupUrl={design.mockupUrl}
          alt={title}
          colourMockups={shirtColours}
          featuredVariantId={design.featuredVariantId}
          selectedColour={selectedColour}
          onSelectColour={setSelectedColour}
          showArt={showArt}
          onToggleArt={setShowArt}
        />

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

      {/* Right Column: Transactional Panel with Colour Selector below pricing */}
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
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
          isSignedIn={isSignedIn}
          viewerEmail={viewerEmail}
          viewerDisplayName={viewerDisplayName}
        />
      </div>
    </div>
  )
}
