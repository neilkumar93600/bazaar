"use client"

import { useEffect, useState } from "react"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import {
  getDesignDialogData,
  type DesignDialogData,
} from "@/app/(public)/design/[id]/actions"
import { designLabel } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CreatorCard } from "@/components/design/CreatorCard"
import { DesignDetailPanel } from "@/components/design/DesignDetailPanel"
import { DesignGallery } from "@/components/design/DesignGallery"

/** The design, as a popup over whatever grid you clicked it from.
 *
 *  Fetched on open rather than passed in: a card only knows the list-view
 *  fields, not the buyer's order options or sign-in state, and fetching those
 *  for every card in a grid up front would be wasted work for the ones never
 *  opened. */
export function DesignDialog({
  designId,
  open,
  onOpenChange,
}: {
  designId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<DesignDialogData | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    if (!open || loadedFor === designId) return

    let cancelled = false
    getDesignDialogData(designId)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoadedFor(designId)
        }
      })
      // Without this the skeleton spins forever: `loadedFor` never advances,
      // so the effect's own guard stops it retrying too.
      .catch((error) => {
        console.error("[design] could not load the dialog", error)
        if (!cancelled) {
          setData(null)
          setLoadedFor(designId)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, designId, loadedFor])

  const design = loadedFor === designId ? data?.design : null
  const title = design ? designLabel(design) : "Design"

  const availableColours: string[] =
    data?.shirtColours && data.shirtColours.length > 0
      ? data.shirtColours.map((c) => c.colour)
      : data?.orderOptions?.colours && data.orderOptions.colours.length > 0
      ? data.orderOptions.colours.map((c) => c.colour)
      : [
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

  const [selectedColour, setSelectedColour] = useState("Black")
  const [showArt, setShowArt] = useState(false)
  const [side, setSide] = useState<"front" | "back">("front")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-border/80 bg-card p-6 shadow-2xl sm:max-w-2xl lg:max-w-5xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {loadedFor !== designId ? (
          <DialogSkeleton />
        ) : !design ? (
          <p className="py-12 text-center text-body-sm text-muted-ink">
            This design isn&apos;t available anymore.
          </p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: Gallery + Creator Card + About artwork (on desktop) */}
            <div className="flex flex-col gap-6 lg:col-span-6">
              <DesignGallery
                imageUrl={design.imageUrl}
                mockupUrl={design.mockupUrl}
                backMockupUrl={design.backMockupUrl}
                alt={title}
                colourMockups={data!.shirtColours}
                backColourMockups={data!.backShirtColours}
                featuredVariantId={design.featuredVariantId}
                selectedColour={selectedColour}
                onSelectColour={setSelectedColour}
                showArt={showArt}
                onToggleArt={setShowArt}
                side={side}
              />

              <div className="hidden lg:flex flex-col gap-5">
                {design.creator && <CreatorCard creator={design.creator} />}
                {design.description && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                    <h4 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                      About this artwork
                    </h4>
                    <p className="text-body-sm text-muted-ink leading-relaxed">
                      {design.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Transactional details, buy form, accordions */}
            <div className="flex flex-col justify-between gap-6 lg:col-span-6">
              <div className="flex flex-col gap-6">
                <DesignDetailPanel
                  design={design}
                  orderOptions={data!.orderOptions}
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
                  isSignedIn={data!.viewerIsLoggedIn}
                  viewerEmail={data!.viewerEmail}
                  viewerDisplayName={data!.viewerName}
                />

                {/* Mobile only: Creator + Description under buy section */}
                <div className="flex lg:hidden flex-col gap-5">
                  {design.creator && <CreatorCard creator={design.creator} />}
                  {design.description && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                      <h4 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                        About this artwork
                      </h4>
                      <p className="text-body-sm text-muted-ink leading-relaxed">
                        {design.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-border/80 pt-4">
                <Link
                  href={`/design/${design.id}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
                >
                  <span>Open full design page</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DialogSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-6">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  )
}
