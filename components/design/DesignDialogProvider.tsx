"use client"

import { createContext, useContext, useState, useTransition, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import {
  getDesignDialogData,
  type DesignDialogData,
} from "@/app/(public)/design/[id]/actions"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DesignDetailContent } from "@/components/design/DesignDetailContent"
import { DesignDialogSkeleton } from "@/components/design/DesignDialogSkeleton"
import { designLabel } from "@/lib/utils"

type DesignDialogContextValue = {
  openDesign: (id: string) => void
}

const DesignDialogContext = createContext<DesignDialogContextValue | null>(null)

/** Null outside a provider rather than a thrown error. Every caller opens the
 *  dialog as an enhancement over a real link to /design/[id], so the absence of
 *  a provider is a reason to navigate — not to take the page down. It also
 *  stops Fast Refresh from blanking the screen when this module reloads and a
 *  card still holds the previous context identity. */
export function useDesignDialog() {
  return useContext(DesignDialogContext)
}

export function DesignDialogProvider({ children }: { children: ReactNode }) {
  const [designId, setDesignId] = useState<string | null>(null)
  // The action's own return type rather than a local restatement of it — a
  // second copy is a second thing to forget to update.
  const [data, setData] = useState<DesignDialogData | null>(null)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  // Dialog state lives at the layout level so it survives route changes -
  // but that means it must be explicitly closed on navigation, or a link
  // inside it (View storefront, the post-claim redirect) leaves the dialog
  // stuck open over whatever page loads next. Adjusting state during render
  // (React's sanctioned pattern for "reset on prop change") rather than in
  // an effect, which would cause an extra render pass after the close.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setDesignId(null)
    setData(null)
  }

  const openDesign = (id: string) => {
    setDesignId(id)
    setData(null)
    startTransition(async () => {
      const result = await getDesignDialogData(id)
      setData(result)
    })
  }

  const close = () => {
    setDesignId(null)
    setData(null)
  }

  return (
    <DesignDialogContext.Provider value={{ openDesign }}>
      {children}
      <Dialog
        open={designId !== null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border-border/80 p-6 shadow-2xl backdrop-blur-xl sm:max-w-xl md:max-w-3xl">
          <DialogTitle className="sr-only">
            {data?.design ? designLabel(data.design, 70) : "Design"}
          </DialogTitle>
          {isPending || !data ? (
            <DesignDialogSkeleton />
          ) : data.design ? (
            <DesignDetailContent
              design={data.design}
              viewerIsLoggedIn={data.viewerIsLoggedIn}
              viewerEmail={data.viewerEmail}
              orderOptions={data.orderOptions}
            />
          ) : (
            <p className="text-body-sm text-muted-foreground">Design not found.</p>
          )}
        </DialogContent>
      </Dialog>
    </DesignDialogContext.Provider>
  )
}
