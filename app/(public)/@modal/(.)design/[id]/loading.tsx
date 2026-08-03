"use client"

import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  const router = useRouter()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-xl md:max-w-3xl">
        <DialogTitle className="sr-only">Loading design</DialogTitle>
        <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-start">
          <Skeleton className="aspect-[4/5] w-full shrink-0 md:w-72" />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <div className="flex items-baseline justify-between gap-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
