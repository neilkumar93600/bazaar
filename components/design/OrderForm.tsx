"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  placeGarmentOrder,
  type OrderOptions,
} from "@/app/(public)/design/[id]/order-actions"
import { toneForColourName } from "@/lib/printify/tones"
import { formatCents, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const FIELDS: { name: string; label: string; autoComplete: string }[] = [
  { name: "firstName", label: "First name", autoComplete: "given-name" },
  { name: "lastName", label: "Last name", autoComplete: "family-name" },
  { name: "email", label: "Email", autoComplete: "email" },
  { name: "phone", label: "Phone", autoComplete: "tel" },
  { name: "address1", label: "Address", autoComplete: "address-line1" },
  { name: "address2", label: "Address line 2 (optional)", autoComplete: "address-line2" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "region", label: "State / province", autoComplete: "address-level1" },
  { name: "zip", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country code (e.g. US, GB)", autoComplete: "country" },
]

/** Buy a printed garment of a claimed design.
 *
 *  Sizes come from the chosen colour, never from a global list: Printify fuses
 *  colour and size into one variant, and a colour that only stocks S must not
 *  offer 2XL. The size button carries the actual variant id that gets ordered. */
export function OrderForm({
  designId,
  options,
  featuredVariantId,
  defaultEmail,
}: {
  designId: string
  options: NonNullable<OrderOptions>
  /** The maker's colour, used as the starting selection. */
  featuredVariantId: number | null
  defaultEmail: string
}) {
  const router = useRouter()

  const initialColour =
    options.colours.find((option) => option.variantId === featuredVariantId)
      ?.colour ??
    options.colours[0]?.colour ??
    ""

  const [colour, setColour] = useState(initialColour)
  const [variantId, setVariantId] = useState<number | null>(
    () => options.sizesByColour[initialColour]?.[0]?.variantId ?? null
  )
  const [address, setAddress] = useState<Record<string, string>>({
    email: defaultEmail,
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sizes = options.sizesByColour[colour] ?? []

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-ink bg-card p-6 text-card-foreground shadow-[var(--shadow-xl-2)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-body-sm font-medium text-foreground">
          {options.garmentLabel}
        </span>
        <span className="font-mono text-heading-sm text-ink font-semibold">
          {formatCents(options.priceCents)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-caption">Colour{colour ? ` · ${colour}` : ""}</Label>
        <div className="flex flex-wrap gap-1.5">
          {options.colours.map((option) => {
            const swatch = toneForColourName(option.colour)
            const active = option.colour === colour
            return (
              <button
                key={option.variantId}
                type="button"
                aria-label={option.colour}
                aria-pressed={active}
                title={option.colour}
                disabled={isPending}
                onClick={() => {
                  setColour(option.colour)
                  // The old size may not exist in the new colour.
                  setVariantId(
                    options.sizesByColour[option.colour]?.[0]?.variantId ?? null
                  )
                }}
                style={swatch ? { backgroundColor: swatch.body } : undefined}
                className={cn(
                  "size-7 rounded-full border transition disabled:opacity-50",
                  active
                    ? "border-ink ring-2 ring-ink/30"
                    : "border-border hover:border-ink",
                  !swatch && "bg-secondary text-caption text-muted-foreground"
                )}
              >
                {swatch ? "" : option.colour.slice(0, 1)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-caption">Size</Label>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((option) => (
            <button
              key={option.variantId}
              type="button"
              aria-pressed={option.variantId === variantId}
              disabled={isPending}
              onClick={() => setVariantId(option.variantId)}
              className={cn(
                "rounded-lg border border-ink px-3 py-1.5 text-caption font-medium transition-colors disabled:opacity-50",
                option.variantId === variantId
                  ? "bg-depth text-paper-white border-depth"
                  : "bg-paper-white text-ink hover:bg-accent"
              )}
            >
              {option.size}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <div
            key={field.name}
            className={cn(
              "flex flex-col gap-1",
              (field.name === "address1" || field.name === "address2") &&
                "col-span-2"
            )}
          >
            <Label htmlFor={`${field.name}-${designId}`} className="text-caption">
              {field.label}
            </Label>
            <Input
              id={`${field.name}-${designId}`}
              autoComplete={field.autoComplete}
              value={address[field.name] ?? ""}
              onChange={(event) =>
                setAddress((current) => ({
                  ...current,
                  [field.name]: event.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <Button
        variant="ember"
        disabled={isPending || variantId === null}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await placeGarmentOrder(designId, variantId!, address)
            if (result.error) {
              setError(result.error)
              return
            }
            router.push("/dashboard/orders")
          })
        }}
      >
        {isPending ? "Placing order…" : `Order for ${formatCents(options.priceCents)}`}
      </Button>

      <p className="text-caption text-muted-foreground">
        Printed and shipped by our print partner. The design&apos;s owner earns a
        royalty on every order.
      </p>
    </div>
  )
}
