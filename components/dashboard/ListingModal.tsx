"use client"

import Image from "next/image"
import { Shirt } from "lucide-react"

import type { MakerDesign } from "@/lib/data/my-designs"
import type { GarmentOption } from "@/app/dashboard/designs/garment-options"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ListingForm } from "@/components/dashboard/ListingForm"

export function ListingModal({
  design,
  garmentOptions,
  open,
  onOpenChange,
  onSuccess,
}: {
  design: MakerDesign
  garmentOptions: GarmentOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fires only when the design actually goes live — distinct from
   *  onOpenChange(false), which also fires on a plain cancel. */
  onSuccess?: () => void
}) {
  const isListed = Boolean(design.listedAt)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl sm:max-w-lg md:max-w-2xl">
        <DialogHeader className="flex flex-col gap-1 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5 text-primary">
            <Shirt className="size-5" />
            <DialogTitle className="text-heading-sm text-foreground">
              {isListed ? "Edit Listing Settings" : "Configure & List Design"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-body-sm text-muted-foreground">
            {isListed
              ? "Update garment specifications, pricing, or placement for your live design."
              : "Select your garment options, set your listing price, and publish your design to the Bazaar."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start">
          {/* Design preview on left */}
          <div className="flex shrink-0 flex-col items-center gap-3 w-full md:w-52">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm">
              <Image
                src={design.mockupUrl ?? design.imageUrl}
                alt={design.vibeName ?? "Design artwork"}
                fill
                sizes="(min-width: 768px) 208px, 100vw"
                className="object-cover"
              />
            </div>
            {design.vibeName && (
              <span className="rounded-full bg-accent px-3 py-1 text-caption font-medium text-foreground">
                {design.vibeName}
              </span>
            )}
          </div>

          {/* Form on right */}
          <div className="flex-1 min-w-0">
            <ListingForm
              designId={design.id}
              imageUrl={design.imageUrl}
              isListed={isListed}
              priceCents={design.priceCents}
              garmentOptions={garmentOptions}
              frozen={design.hasProduct}
              initialConfig={{
                garmentSlug: design.garmentSlug,
                variantId: design.featuredVariantId,
                placement: design.placement,
              }}
              onSuccess={() => {
                onOpenChange(false)
                onSuccess?.()
              }}
              hideInlineThumbnail
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
