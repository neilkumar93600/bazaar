"use client"

import { useRouter } from "next/navigation"

import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DesignDetailContent } from "@/components/design/DesignDetailContent"

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
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-xl md:max-w-3xl">
        <DialogTitle className="sr-only">
          {design.vibeName ?? "Design"} — {design.isClaimed ? "claimed" : "unclaimed"}
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
