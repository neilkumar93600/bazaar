"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { Sparkles, EyeOff, Info, Copy, Check } from "lucide-react"

import type { DesignDetail } from "@/lib/data/design"
import type { OrderOptions } from "@/app/(public)/design/[id]/order-actions"
import { designLabel, formatListingPrice } from "@/lib/utils"
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
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = () => {
    if (!design.prompt) return
    navigator.clipboard.writeText(design.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-start">
      {/* The same garment the card showed — opening a design shouldn't swap the
          product for its artwork. */}
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:w-72">
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
          {/* Vibe demoted to the eyebrow beside the date: it's the category,
              not the name. The heading below is this design's own. */}
          <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            {design.vibeName ? `${design.vibeName} · ` : ""}
            Minted {formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="min-w-0 text-heading-lg text-foreground">
              {designLabel(design)}
            </h2>
            <span className="shrink-0 font-mono text-heading-sm font-semibold text-gold-leaf">
              {formatListingPrice(design.priceCents)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
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

        {/* Prompt & Idea Section — always rendered to clearly explain the prompt status */}
        {design.isPromptHidden ? (
          /* State 1: Creator explicitly hid the prompt */
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <EyeOff className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-caption font-semibold tracking-wide uppercase">
                Prompt / Idea
              </span>
              <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-caption font-medium text-muted-foreground">
                Hidden
              </span>
            </div>
            <p className="text-body-sm font-medium text-foreground">
              Prompt hidden by creator
            </p>
            <p className="text-caption text-muted-foreground">
              The creator of this design chose to keep the generation prompt private.
            </p>
          </div>
        ) : design.prompt ? (
          /* State 2: Prompt is available */
          <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-card p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4 shrink-0" />
                <span className="text-caption font-semibold tracking-wide uppercase">
                  Prompt / Idea
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyPrompt}
                title="Copy prompt text"
                className="h-7 px-2.5 text-caption font-medium text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="mr-1 size-3 text-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-3" />
                    Copy prompt
                  </>
                )}
              </Button>
            </div>
            
            <blockquote className="border-l-2 border-primary/60 pl-3 font-mono text-body-sm break-words text-foreground italic">
              &ldquo;{design.prompt}&rdquo;
            </blockquote>

            {design.quote && (
              <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
                <span className="text-caption font-medium text-muted-foreground">Line text:</span>
                <p className="font-mono text-caption text-foreground">{design.quote}</p>
              </div>
            )}
          </div>
        ) : (
          /* State 3: Prompt is not available */
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-caption font-semibold tracking-wide uppercase">
                Prompt / Idea
              </span>
            </div>
            <p className="text-body-sm font-medium text-foreground">
              Prompt not available
            </p>
            <p className="text-caption text-muted-foreground">
              No original prompt text was recorded for this design.
            </p>
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
