"use client"

import { useState, useTransition } from "react"

import { formatCents } from "@/lib/utils"
import { QUALITY_TIERS, SIZES, computeTotalCents, type QualityTier, type Size } from "@/lib/pricing"
import { claimDesign } from "@/app/(public)/design/[id]/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ClaimForm({
  designId,
  basePriceCents,
}: {
  designId: string
  basePriceCents: number
}) {
  const [qualityTier, setQualityTier] = useState<QualityTier>("everyday")
  const [size, setSize] = useState<Size>("M")
  const [placementFront, setPlacementFront] = useState(true)
  const [placementBack, setPlacementBack] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const totalCents = computeTotalCents(basePriceCents, qualityTier, placementFront, placementBack)
  const canSubmit = placementFront || placementBack

  return (
    <div className="glass-surface flex flex-col gap-6 rounded-xl border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-3">
        <span className="text-body-sm font-medium text-foreground">Quality</span>
        <RadioGroup
          value={qualityTier}
          onValueChange={(value) => setQualityTier(value as QualityTier)}
        >
          {QUALITY_TIERS.map((tier) => (
            <div key={tier.value} className="flex items-start gap-2.5">
              <RadioGroupItem value={tier.value} id={`tier-${tier.value}`} className="mt-0.5" />
              <Label htmlFor={`tier-${tier.value}`} className="flex-col items-start gap-0.5">
                <span className="text-foreground">
                  {tier.label}
                  {tier.deltaCents > 0 && ` (+${formatCents(tier.deltaCents)})`}
                </span>
                <span className="font-normal text-muted-foreground">{tier.blurb}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-body-sm font-medium text-foreground">Placement</span>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="placement-front"
            checked={placementFront}
            onCheckedChange={(checked) => setPlacementFront(checked === true)}
          />
          <Label htmlFor="placement-front">Front</Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="placement-back"
            checked={placementBack}
            onCheckedChange={(checked) => setPlacementBack(checked === true)}
          />
          <Label htmlFor="placement-back">
            Back {placementFront && `(+${formatCents(800)} for both sides)`}
          </Label>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-body-sm font-medium text-foreground">Size</span>
        <Select value={size} onValueChange={(value) => setSize(value as Size)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <Button
        variant="ember"
        disabled={!canSubmit || isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await claimDesign(designId, {
              qualityTier,
              size,
              placementFront,
              placementBack,
            })
            if (result?.error) setError(result.error)
          })
        }}
      >
        {isPending ? "Claiming…" : `Claim for ${formatCents(totalCents)}`}
      </Button>
    </div>
  )
}
