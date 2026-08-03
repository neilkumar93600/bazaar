import Image from "next/image"
import Link from "next/link"
import { format, formatDistanceToNowStrict } from "date-fns"

import type { DesignDetail } from "@/lib/data/design"
import { formatCents } from "@/lib/utils"
import { ClaimForm } from "@/components/design/ClaimForm"
import { Button } from "@/components/ui/button"

export function DesignDetailContent({
  design,
  viewerIsLoggedIn,
}: {
  design: DesignDetail
  viewerIsLoggedIn: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 448px, 100vw"
          priority
          className="object-cover"
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-heading-lg text-foreground">
          {design.vibeName ?? "Unfiled"}
        </span>
        <span className="font-mono text-heading-sm text-gold-leaf">
          {formatCents(design.priceCents)}
        </span>
      </div>

      {design.prompt && (
        <p className="text-body-sm text-muted-foreground italic">
          &ldquo;{design.prompt}&rdquo;
        </p>
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
        <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
          <p className="text-body-sm text-muted-foreground">
            {design.claimantHandle ? (
              <>
                One-of-one. Claimed by{" "}
                <Link
                  href={`/creator/${design.claimantHandle}`}
                  className="text-foreground underline underline-offset-4"
                >
                  @{design.claimantHandle}
                </Link>
                {design.claimedAt &&
                  ` · ${format(new Date(design.claimedAt), "MMM d, yyyy")}`}
              </>
            ) : (
              "One-of-one. Claimed."
            )}
          </p>
          {design.claimantHandle && (
            <Button variant="outline" render={<Link href={`/creator/${design.claimantHandle}`} />}>
              View storefront
            </Button>
          )}
        </div>
      ) : viewerIsLoggedIn ? (
        <ClaimForm designId={design.id} priceCents={design.priceCents} />
      ) : (
        <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
          <p className="text-body-sm text-muted-foreground">
            One-of-one. Unclaimed ·{" "}
            {formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}.
          </p>
          <Button variant="ember" render={<Link href="/login" />}>
            Log in to claim
          </Button>
        </div>
      )}
    </div>
  )
}
