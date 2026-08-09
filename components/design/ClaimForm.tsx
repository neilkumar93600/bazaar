"use client"

import { useState, useTransition } from "react"

import { formatListingPrice } from "@/lib/utils"
import { claimDesign } from "@/app/(public)/design/[id]/actions"
import { Button } from "@/components/ui/button"

export function ClaimForm({
  designId,
  priceCents,
}: {
  designId: string
  /** Null means the maker listed it free. */
  priceCents: number | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
      <p className="text-body-sm text-muted-foreground">
        Claiming makes you the permanent owner of this 1-of-1 design: you get a
        storefront and a royalty on every future resale.
      </p>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <Button
        variant="ember"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await claimDesign(designId, priceCents)
            if (result?.error) setError(result.error)
          })
        }}
      >
        {isPending
          ? "Claiming…"
          : priceCents === null
            ? "Claim it — free"
            : `Claim for ${formatListingPrice(priceCents)}`}
      </Button>
    </div>
  )
}
