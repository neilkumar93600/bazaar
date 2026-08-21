import Link from "next/link"
import { format, formatDistanceToNowStrict } from "date-fns"

import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import { designLabel, formatListingPrice } from "@/lib/utils"
import { BuyForm } from "@/components/design/BuyForm"
import { OrderForm } from "@/components/design/OrderForm"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

/** The transactional column: name, price, buy/order control, then the detail
 *  accordions. Shared by the full design page and the card popup so "buy"
 *  behaves identically in both — one code path, not two that can drift. */
export function DesignDetailPanel({
  design,
  orderOptions,
  isSignedIn,
  viewerEmail,
  viewerDisplayName,
}: {
  design: DesignDetail
  orderOptions: OrderOptions
  isSignedIn: boolean
  viewerEmail: string
  viewerDisplayName: string
}) {
  const title = designLabel(design)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 text-heading md:text-heading-lg font-semibold break-words text-foreground">
            <FormattedTitle title={title} />
          </h1>
          {design.isClaimed ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-3 py-1 text-caption font-medium text-ink">
              <span className="size-1.5 rounded-full bg-[#7ee2b8]" aria-hidden />
              Claimed
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-ink bg-transparent px-3 py-1 text-caption font-medium tracking-[0.08em] text-ink uppercase">
              1 of 1
            </span>
          )}
        </div>
        <p className="text-body text-muted-ink">
          {design.vibeName ? `${design.vibeName} · ` : ""}
          Minted{" "}
          {formatDistanceToNowStrict(new Date(design.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <span className="font-mono text-heading text-foreground font-semibold">
        {formatListingPrice(design.priceCents)}
      </span>

      {design.isClaimed ? (
        <>
          {design.claimantHandle && (
            <p className="text-body-sm text-muted-ink">
              Owned by{" "}
              <Link
                href={`/creator/${design.claimantHandle}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                @{design.claimantHandle}
              </Link>
              . The artwork is spoken for — the print below is still open to
              anyone.
            </p>
          )}

          {orderOptions ? (
            isSignedIn ? (
              <OrderForm
                designId={design.id}
                options={orderOptions}
                featuredVariantId={design.featuredVariantId}
                defaultEmail={viewerEmail}
              />
            ) : (
              <SignInPanel
                message="Sign in to order this design printed."
                label="Log in to order"
              />
            )
          ) : null}
        </>
      ) : (
        <BuyForm
          designId={design.id}
          priceCents={design.priceCents}
          defaultName={viewerDisplayName}
          defaultEmail={viewerEmail}
          isGuest={!isSignedIn}
        />
      )}

      <Accordion defaultValue={["prompt"]} className="mt-2">
        <AccordionItem value="prompt">
          <AccordionTrigger className="text-body font-semibold">
            Prompt
          </AccordionTrigger>
          <AccordionContent>
            {design.isPromptHidden ? (
              <p className="text-body-sm text-muted-ink">
                The creator kept this one private. Hiding the prompt hides
                the recipe, not the design.
              </p>
            ) : design.prompt ? (
              <>
                <blockquote className="border-l-2 border-ink pl-3.5 py-1 font-mono text-body-sm break-words text-ink italic">
                  &ldquo;{design.prompt}&rdquo;
                </blockquote>
                {design.quote && (
                  <p className="mt-3 font-mono text-caption text-muted-ink">
                    Line text: {design.quote}
                  </p>
                )}
              </>
            ) : (
              <p className="text-body-sm text-muted-ink">
                No prompt text was recorded for this design.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="details">
          <AccordionTrigger className="text-body font-semibold">
            Design details
          </AccordionTrigger>
          <AccordionContent>
            <DetailRow label="Edition" value="1 of 1 — never generated again" />
            <DetailRow
              label="Status"
              value={
                design.isClaimed
                  ? design.claimantHandle
                    ? `Claimed by @${design.claimantHandle}`
                    : "Claimed"
                  : "Unclaimed"
              }
            />
            {design.vibeName && (
              <DetailRow label="Vibe" value={design.vibeName} />
            )}
            <DetailRow
              label="Minted"
              value={format(new Date(design.createdAt), "d MMMM yyyy")}
            />
            <DetailRow
              label="File"
              value="Flat artwork PNG, transparent, print-ready"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="included">
          <AccordionTrigger className="text-body font-semibold">
            What you get
          </AccordionTrigger>
          <AccordionContent>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-body-sm text-muted-ink">
              <li>
                The artwork file itself, emailed on purchase — the flat
                design, not a photo of a shirt.
              </li>
              <li>Permanent ownership of a 1-of-1. Nobody else can claim it.</li>
              <li>A storefront of your own, with this design on it.</li>
              <li>A royalty on every printed order of it, forever.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

/** Splits multi-word headlines to give the final word Fraunces italic emphasis
 *  as required by docs/DESIGN.md. */
function FormattedTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) {
    return <>{title}</>
  }
  const main = words.slice(0, -1).join(" ")
  const last = words[words.length - 1]
  return (
    <>
      {main} <em className="font-serif font-normal italic">{last}</em>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-0">
      <span className="shrink-0 text-body-sm font-medium text-ink">
        {label}
      </span>
      <span className="text-right text-body-sm text-muted-ink">{value}</span>
    </div>
  )
}

function SignInPanel({ message, label }: { message: string; label: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink bg-card p-6 text-card-foreground shadow-[var(--shadow-xl-2)]">
      <p className="text-body-sm text-muted-ink">{message}</p>
      <Button variant="ember" className="h-11 w-full" render={<Link href="/login" />}>
        {label}
      </Button>
    </div>
  )
}
