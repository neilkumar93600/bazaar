"use client"

import { createContext, useContext, useState, useTransition, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import type { DesignDetail } from "@/lib/data/design"
import { getDesignDialogData } from "@/app/(public)/design/[id]/actions"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DesignDetailContent } from "@/components/design/DesignDetailContent"
import { DesignDialogSkeleton } from "@/components/design/DesignDialogSkeleton"

type DesignDialogContextValue = {
  openDesign: (id: string) => void
}

const DesignDialogContext = createContext<DesignDialogContextValue | null>(null)

export function useDesignDialog() {
  const ctx = useContext(DesignDialogContext)
  if (!ctx) {
    throw new Error("useDesignDialog must be used within DesignDialogProvider")
  }
  return ctx
}

export function DesignDialogProvider({ children }: { children: ReactNode }) {
  const [designId, setDesignId] = useState<string | null>(null)
  const [data, setData] = useState<{
    design: DesignDetail | null
    viewerIsLoggedIn: boolean
  } | null>(null)
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
        <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-xl md:max-w-3xl">
          <DialogTitle className="sr-only">
            {data?.design ? (data.design.vibeName ?? "Design") : "Design"}
          </DialogTitle>
          {isPending || !data ? (
            <DesignDialogSkeleton />
          ) : data.design ? (
            <DesignDetailContent design={data.design} viewerIsLoggedIn={data.viewerIsLoggedIn} />
          ) : (
            <p className="text-body-sm text-muted-foreground">Design not found.</p>
          )}
        </DialogContent>
      </Dialog>
    </DesignDialogContext.Provider>
  )
}
