"use client"

import { useState, useTransition } from "react"

import { useRouter } from "next/navigation"

import { formatListingPrice } from "@/lib/utils"
import { openBoltCheckout } from "@/lib/payments/bolt-client"
import { buyDesign, completeBoltPurchase } from "@/app/(public)/design/[id]/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Buy a design outright.
 *
 *  Two steps, not one: "Buy now" opens for the buyer's name and email before
 *  anything is charged or claimed. The email is not decoration — the receipt
 *  and the design file itself are delivered to it, and it may well not be the
 *  address the account was opened with.
 */
export function BuyForm({
  designId,
  priceCents,
  defaultName = "",
  defaultEmail = "",
  isGuest = false,
}: {
  designId: string
  /** Null means the maker listed it free. */
  priceCents: number | null
  defaultName?: string
  defaultEmail?: string
  /** Nobody signed in. The email below becomes the account the design is
   *  owned by, which is worth saying out loud before they type it. */
  isGuest?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isFree = priceCents === null

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await buyDesign(designId, priceCents, { name, email })

      if (result?.error) {
        setError(result.error)
        return
      }

      // A free purchase redirects server-side and never returns. A priced one
      // comes back with a token for Bolt's modal — which opens over this page
      // rather than navigating away, so the buyer never leaves the design.
      if (!result?.boltToken || !result.boltPublishableKey) return

      let outcome
      try {
        outcome = await openBoltCheckout(result.boltToken, result.boltPublishableKey)
      } catch (checkoutError) {
        console.error("[buy] Bolt checkout failed", checkoutError)
        setError("Checkout wouldn't open. Try again.")
        return
      }

      // Closed without paying. No error: they chose this.
      if (outcome.status !== "success") return

      // The webhook will finish this purchase regardless. Calling it here too
      // means the buyer sees their storefront now rather than whenever the
      // queue drains; it is idempotent, so both running changes nothing.
      const completion = await completeBoltPurchase(outcome.reference)

      if (completion.error) {
        setError(completion.error)
        return
      }

      router.push(
        completion.handle ? `/creator/${completion.handle}` : "/dashboard/designs",
      )
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink bg-card p-6 text-card-foreground shadow-[var(--shadow-xl-2)]">
      <p className="text-body-sm text-muted-ink">
        Buying makes you the permanent owner of this 1-of-1 design: the artwork
        file lands in your inbox, you get a storefront, and you earn a royalty
        on every future sale.
      </p>

      {open && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`buyer-name-${designId}`} className="text-caption">
              Full name
            </Label>
            <Input
              id={`buyer-name-${designId}`}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
              // h-11: the shared Input is 36px, under the 44px a thumb needs.
              // This is a checkout on a phone, so it gets the bigger target.
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`buyer-email-${designId}`} className="text-caption">
              Email
            </Label>
            <Input
              id={`buyer-email-${designId}`}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              className="h-11"
            />
            <span className="text-caption text-muted-ink">
              Your receipt and the design file go here.
              {isGuest
                ? " No account needed — this address becomes yours, and you can set a password later."
                : ""}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <Button
        variant="ember"
        disabled={isPending}
        className="h-11 w-full"
        onClick={() => (open ? submit() : setOpen(true))}
      >
        {isPending
          ? isFree
            ? "Claiming…"
            : "Opening checkout…"
          : !open
            ? `Buy now — ${formatListingPrice(priceCents)}`
            : isFree
              ? "Claim it — free"
              : `Pay ${formatListingPrice(priceCents)}`}
      </Button>

      {open && !isFree && (
        <p className="text-caption text-muted-ink">
          Card details are entered in Bolt&apos;s own secure checkout. We never
          see them.
        </p>
      )}
    </div>
  )
}
