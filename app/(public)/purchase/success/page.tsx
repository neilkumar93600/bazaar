import type { Metadata } from "next"
import Link from "next/link"

import { fulfilBoltTransaction } from "@/lib/payments/fulfil"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Purchase complete",
  robots: { index: false, follow: false },
}

/** The fallback landing for a card purchase.
 *
 *  Bolt's checkout is a modal, so the ordinary path never comes here — the
 *  buyer finishes on the design page and is sent to their storefront. This
 *  page is what a shopper reaches from a link that carries a reference: a
 *  support hand-off, or a modal that closed before its callback ran.
 *
 *  It fulfils rather than merely reporting: the webhook is authoritative but
 *  can be seconds behind, or absent entirely in an environment where nobody
 *  has wired one up. fulfilBoltTransaction is idempotent, so whichever path
 *  gets here first wins and the others find the work done.
 *
 *  The reference is a URL parameter and therefore untrusted — which is fine.
 *  Fulfilment re-reads the transaction from Bolt and does nothing unless Bolt
 *  itself says the payment settled.
 */
export default async function PurchaseSuccessPage(
  props: PageProps<"/purchase/success">
) {
  const searchParams = await props.searchParams
  const reference =
    typeof searchParams.reference === "string" ? searchParams.reference : ""

  const result = reference
    ? await fulfilBoltTransaction(reference)
    : ({ ok: false, error: "That link is missing its payment reference." } as const)

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-16 md:px-16 sm:py-24">
      {/* text-heading until sm: at 56px the uppercase failure heading is wider
          than a 375px phone and pushes the whole page sideways. */}
      <h1 className="text-heading tracking-tight text-foreground uppercase break-words sm:text-display">
        {result.ok ? "It's yours" : "Something's off"}
      </h1>

      {result.ok ? (
        <>
          <p className="text-body text-muted-foreground">
            Payment received. Your receipt and the design file — the flat
            artwork itself, not a shirt photo — are on their way to the email
            you gave at checkout.
          </p>
          {/* h-11 throughout: 44px is the smallest comfortable thumb target,
              and the shared Button is 36px. */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            {result.handle && (
              <Button
                variant="ember"
                className="h-11"
                render={<Link href={`/creator/${result.handle}`} />}
              >
                View your storefront
              </Button>
            )}
            <Button
              variant="outline"
              className="h-11"
              render={<Link href="/dashboard/orders" />}
            >
              Your orders
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-body text-muted-foreground">{result.error}</p>
          <Button variant="outline" className="h-11" render={<Link href="/shop" />}>
            Back to the bazaar
          </Button>
        </>
      )}
    </div>
  )
}
