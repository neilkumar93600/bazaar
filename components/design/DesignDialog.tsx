"use client"

import { useRouter } from "next/navigation"

import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DesignDetailContent } from "@/components/design/DesignDetailContent"
import { designLabel } from "@/lib/utils"

export function DesignDialog({
  design,
  viewerIsLoggedIn,
  viewerEmail,
  orderOptions,
}: {
  design: DesignDetail
  viewerIsLoggedIn: boolean
  viewerEmail: string
  orderOptions: OrderOptions
}) {
  const router = useRouter()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border-border/80 p-6 shadow-2xl backdrop-blur-xl sm:max-w-xl md:max-w-3xl">
        <DialogTitle className="sr-only">
          {designLabel(design, 70)} — {design.isClaimed ? "claimed" : "unclaimed"}
        </DialogTitle>
        <DesignDetailContent
          design={design}
          viewerIsLoggedIn={viewerIsLoggedIn}
          viewerEmail={viewerEmail}
          orderOptions={orderOptions}
        />
      </DialogContent>
    </Dialog>
  )
}
