import Link from "next/link"
import { ShirtIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { StorefrontData } from "@/lib/data/storefront"
import { DesignCard } from "@/components/shared/DesignCard"

export function StorefrontGrid({ data }: { data: StorefrontData }) {
  if (data.designs.length === 0 && data.createdDesigns.length === 0) {
    return (
      <Empty className="glass-surface flex-1 rounded-3xl bg-card text-card-foreground">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShirtIcon />
          </EmptyMedia>
          <EmptyTitle>No designs yet</EmptyTitle>
          <EmptyDescription>
            Designs @{data.profile.handle} creates or claims will show up here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link href="/" />}>
            Browse designs
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-10">
      {data.createdDesigns.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-heading-sm text-foreground">Created</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.createdDesigns.map((design, index) => (
              <DesignCard key={design.id} design={design} index={index} />
            ))}
          </div>
        </div>
      )}

      {data.designs.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-heading-sm text-foreground">Claimed</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.designs.map((design, index) => (
              <DesignCard key={design.id} design={design} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
