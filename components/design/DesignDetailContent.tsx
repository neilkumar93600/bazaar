import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"

import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import { formatListingPrice } from "@/lib/utils"
import { ClaimForm } from "@/components/design/ClaimForm"
import { OrderForm } from "@/components/design/OrderForm"
import { ShirtMockup } from "@/components/shared/ShirtMockup"
import { Button } from "@/components/ui/button"

export function DesignDetailContent({
  design,
  viewerIsLoggedIn,
  viewerEmail = "",
  orderOptions = null,
}: {
  design: DesignDetail
  viewerIsLoggedIn: boolean
  /** Prefills the shipping form. Empty for a signed-out viewer. */
  viewerEmail?: string
  /** Null unless the design is claimed and has a Printify product — only then
   *  is there a garment to order. */
  orderOptions?: OrderOptions
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-start">
      {/* The same garment the card showed — opening a design shouldn't swap the
          product for its artwork. */}
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-card md:w-72">
        {design.mockupUrl ? (
          <Image
            src={design.mockupUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 288px, 100vw"
            priority
            className="object-cover"
          />
        ) : (
          <ShirtMockup imageUrl={design.imageUrl} priority />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Minted {formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-heading-lg text-foreground">
              {design.vibeName ?? "Unfiled"}
            </span>
            <span className="shrink-0 font-mono text-heading-sm text-gold-leaf">
              {formatListingPrice(design.priceCents)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
              Edition
            </span>
            <span className="text-body-sm font-medium text-foreground">1 of 1 — never again</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
              Status
            </span>
            <span className="text-body-sm font-medium break-words text-foreground">
              {design.isClaimed
                ? design.claimantHandle
                  ? `Claimed by @${design.claimantHandle}`
                  : "Claimed"
                : "Unclaimed"}
            </span>
          </div>
        </div>

        {(design.prompt || design.title) && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
              Prompt
            </span>

            {/* On a poster design the words ARE half the artwork, so showing
                only the illustration idea told you nothing about the shirt in
                front of you. */}
            {design.title && (
              <p className="font-mono text-body-sm break-words text-foreground">
                {design.title}
                {design.quote && (
                  <span className="text-muted-foreground"> — {design.quote}</span>
                )}
              </p>
            )}

            {design.prompt && (
              <p className="font-mono text-body-sm break-words text-muted-foreground">
                {design.prompt}
              </p>
            )}
          </div>
        )}

        {design.creator && (
          <Link
            href={`/creator/${design.creator.handle}`}
            className="glass-surface flex items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground transition-opacity hover:opacity-80"
          >
            {design.creator.avatarUrl ? (
              <Image
                src={design.creator.avatarUrl}
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-body-sm font-medium text-accent-foreground">
                {design.creator.handle.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-body-sm font-medium text-foreground">
                {design.creator.displayName ?? `@${design.creator.handle}`}
              </span>
              {design.creator.bio && (
                <span className="truncate text-caption text-muted-foreground">
                  {design.creator.bio}
                </span>
              )}
            </div>
          </Link>
        )}

        {design.isClaimed ? (
          <>
            {design.claimantHandle && (
              <Button
                variant="outline"
                render={<Link href={`/creator/${design.claimantHandle}`} />}
              >
                View storefront
              </Button>
            )}

            {/* Claimed designs are the only wearable ones: a claim gives the
                design an owner, and every garment order earns them a royalty. */}
            {orderOptions ? (
              viewerIsLoggedIn ? (
                <OrderForm
                  designId={design.id}
                  options={orderOptions}
                  featuredVariantId={design.featuredVariantId}
                  defaultEmail={viewerEmail}
                />
              ) : (
                <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
                  <p className="text-body-sm text-muted-foreground">
                    Sign in to order this design printed.
                  </p>
                  <Button variant="ember" render={<Link href="/login" />}>
                    Log in to order
                  </Button>
                </div>
              )
            ) : null}
          </>
        ) : viewerIsLoggedIn ? (
          <ClaimForm designId={design.id} priceCents={design.priceCents} />
        ) : (
          <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
            <p className="text-body-sm text-muted-foreground">Sign in to claim this design.</p>
            <Button variant="ember" render={<Link href="/login" />}>
              Log in to claim
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
