import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DesignDialogSkeleton } from "@/components/design/DesignDialogSkeleton"

export default function Loading() {
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-xl md:max-w-3xl"
      >
        <DialogTitle className="sr-only">Loading design</DialogTitle>
        <DesignDialogSkeleton />
      </DialogContent>
    </Dialog>
  )
}
