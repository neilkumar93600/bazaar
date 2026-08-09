"use client"

import { useState, useTransition } from "react"

import { listDesign, delistDesign } from "@/app/dashboard/designs/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** List / relist / delist for one design.
 *
 *  Validation runs server-side in `listDesign` and the error comes back as a
 *  string — the client does not re-implement the rule, so there is only one
 *  copy of it to be wrong. */
export function ListingForm({
  designId,
  isListed,
  priceCents,
}: {
  designId: string
  isListed: boolean
  /** Pre-fills the box on a relist: the maker confirms the old number rather
   *  than silently inheriting one they set weeks ago. */
  priceCents: number | null
}) {
  const [free, setFree] = useState(priceCents === null && isListed)
  const [dollars, setDollars] = useState(
    priceCents === null ? "" : (priceCents / 100).toString()
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const priceFieldId = `price-${designId}`
  const freeFieldId = `free-${designId}`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={freeFieldId}
          checked={free}
          onCheckedChange={(checked) => setFree(checked === true)}
          disabled={isPending}
        />
        <Label htmlFor={freeFieldId} className="text-caption">
          Free to claim
        </Label>
      </div>

      {!free && (
        <div className="flex flex-col gap-1">
          <Label htmlFor={priceFieldId} className="sr-only">
            Price in dollars
          </Label>
          <Input
            id={priceFieldId}
            inputMode="decimal"
            placeholder="29.00"
            value={dollars}
            onChange={(event) => setDollars(event.target.value)}
            disabled={isPending}
          />
        </div>
      )}

      {error && <p className="text-caption text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ember"
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await listDesign(designId, free, dollars)
              if (result.error) setError(result.error)
            })
          }}
        >
          {isListed ? "Update listing" : "Make it live"}
        </Button>

        {isListed && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await delistDesign(designId)
                if (result.error) setError(result.error)
              })
            }}
          >
            Delist
          </Button>
        )}
      </div>
    </div>
  )
}
