"use client"

import { useEffect, useState } from "react"

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
    getDesignDialogData(designId).then((result) => {
      if (!cancelled) {
        setData(result)
        setLoadedFor(designId)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, designId, loadedFor])

  const design = loadedFor === designId ? data?.design : null
  const title = design ? designLabel(design) : "Design"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-border/80 bg-card p-6 shadow-2xl sm:max-w-2xl lg:max-w-4xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {loadedFor !== designId ? (
          <DialogSkeleton />
        ) : !design ? (
          <p className="py-12 text-center text-body-sm text-muted-ink">
            This design isn&apos;t available anymore.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <DesignGallery
                imageUrl={design.imageUrl}
                mockupUrl={design.mockupUrl}
                alt={title}
              />
              {design.creator && <CreatorCard creator={design.creator} />}
            </div>

            <DesignDetailPanel
              design={design}
              orderOptions={data!.orderOptions}
              isSignedIn={data!.viewerIsLoggedIn}
              viewerEmail={data!.viewerEmail}
              viewerDisplayName={data!.viewerName}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DialogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl sm:aspect-square" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  )
}
