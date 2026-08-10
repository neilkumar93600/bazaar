"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import {
  Plus,
  Zap,
  CheckCircle2,
  Heart,
  Edit3,
  ArrowUpRight,
  ShirtIcon,
  Scissors,
} from "lucide-react"

import {
  removeDesignBackground,
  restoreDesignBackground,
} from "@/app/dashboard/designs/actions"

import type { MakerDesign, MyDesigns, AdoptedDesign } from "@/lib/data/my-designs"
import type { GarmentOption } from "@/app/dashboard/designs/garment-options"
import { formatCents, formatListingPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ListingModal } from "@/components/dashboard/ListingModal"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type TabFilter = "all" | "unlisted" | "listed" | "adopted"

export function MyDesignsClient({
  groups,
  garmentOptions,
}: {
  groups: MyDesigns
  garmentOptions: GarmentOption[]
}) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [selectedDesign, setSelectedDesign] = useState<MakerDesign | null>(null)

  const total =
    groups.unlisted.length + groups.listed.length + groups.adopted.length

  if (total === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-heading-lg text-foreground">My designs</h1>
          <Button render={<Link href="/create" />}>
            <Plus className="mr-1.5 size-4" /> Create a design
          </Button>
        </div>
        <Empty className="glass-surface rounded-3xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShirtIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing made yet</EmptyTitle>
            <EmptyDescription>
              Designs you generate stay private to you until you list them.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/create" />}>
              Create a design
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // Determine items to display based on active tab
  const showUnlisted = activeTab === "all" || activeTab === "unlisted"
  const showListed = activeTab === "all" || activeTab === "listed"
  const showAdopted = activeTab === "all" || activeTab === "adopted"

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-lg text-foreground">My designs</h1>
          <p className="mt-1 text-caption tracking-wider text-muted-foreground uppercase">
            {total} {total === 1 ? "design" : "designs"} total
          </p>
        </div>
        <Button render={<Link href="/create" />}>
          <Plus className="mr-1.5 size-4" /> Create a design
        </Button>
      </div>

      {/* Filter Tabs / Stats Bar */}
      <div className="glass-surface flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-body-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          All
          <span className={`rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums ${
            activeTab === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unlisted")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-body-sm font-medium transition-all ${
            activeTab === "unlisted"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Zap className="size-3.5" />
          Unlisted
          <span className={`rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums ${
            activeTab === "unlisted" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {groups.unlisted.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("listed")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-body-sm font-medium transition-all ${
            activeTab === "listed"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          Live
          <span className={`rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums ${
            activeTab === "listed" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {groups.listed.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("adopted")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-body-sm font-medium transition-all ${
            activeTab === "adopted"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Heart className="size-3.5" />
          Adopted
          <span className={`rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums ${
            activeTab === "adopted" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {groups.adopted.length}
          </span>
        </button>
      </div>

      {/* Grid Sections */}
      <div className="flex flex-col gap-10">
        {/* Unlisted Section */}
        {showUnlisted && groups.unlisted.length > 0 && (
          <section className="flex flex-col gap-5">
            {activeTab === "all" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  <h2 className="text-heading-sm text-foreground">Unlisted</h2>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-caption font-medium tabular-nums text-muted-foreground">
                    {groups.unlisted.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="hidden text-caption text-muted-foreground sm:block">
                  Only you can see these
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {groups.unlisted.map((design, i) => (
                <MakerDesignCard
                  key={design.id}
                  design={design}
                  index={i}
                  status="unlisted"
                  onEdit={() => setSelectedDesign(design)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Listed Section */}
        {showListed && groups.listed.length > 0 && (
          <section className="flex flex-col gap-5">
            {activeTab === "all" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <h2 className="text-heading-sm text-foreground">Live in Bazaar</h2>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-caption font-medium tabular-nums text-muted-foreground">
                    {groups.listed.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="hidden text-caption text-muted-foreground sm:block">
                  Visible to buyers
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {groups.listed.map((design, i) => (
                <MakerDesignCard
                  key={design.id}
                  design={design}
                  index={i}
                  status="listed"
                  onEdit={() => setSelectedDesign(design)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Adopted Section */}
        {showAdopted && groups.adopted.length > 0 && (
          <section className="flex flex-col gap-5">
            {activeTab === "all" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-purple-500" />
                  <h2 className="text-heading-sm text-foreground">Adopted</h2>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-caption font-medium tabular-nums text-muted-foreground">
                    {groups.adopted.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="hidden text-caption text-muted-foreground sm:block">
                  Claimed by someone else
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {groups.adopted.map((design, i) => (
                <AdoptedDesignCard key={design.id} design={design} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Listing Modal */}
      {selectedDesign && (
        <ListingModal
          design={selectedDesign}
          garmentOptions={garmentOptions}
          open={Boolean(selectedDesign)}
          onOpenChange={(open) => {
            if (!open) setSelectedDesign(null)
          }}
        />
      )}
    </div>
  )
}

function MakerDesignCard({
  design,
  index,
  status,
  onEdit,
}: {
  design: MakerDesign
  index: number
  status: "unlisted" | "listed"
  onEdit: () => void
}) {
  const isUnlisted = status === "unlisted"

  return (
    <div className={`group/card flex flex-col gap-3 animate-card-rise stagger-${Math.min(index, 13)}`}>
      <div className="glass-surface glass-surface-interactive relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover/card:shadow-xl group-hover/card:border-primary/40">
        <Image
          src={design.mockupUrl ?? design.imageUrl}
          alt={design.vibeName ?? "Design"}
          fill
          sizes="(min-width: 1024px) 240px, 45vw"
          priority={index < 3}
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {/* Status Badge */}
        {isUnlisted ? (
          <span className="absolute top-3 left-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-caption font-medium text-amber-500 backdrop-blur-md shadow-sm">
            Unlisted
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-caption font-medium text-emerald-400 backdrop-blur-md shadow-sm">
            Live
          </span>
        )}

        {/* Hover Action Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pitch/90 via-pitch/30 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100" />
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
          <Button
            type="button"
            variant="ember"
            size="sm"
            onClick={onEdit}
            className="w-full shadow-md"
          >
            <Edit3 className="mr-1.5 size-3.5" />
            {isUnlisted ? "List design" : "Edit listing"}
          </Button>
          <BackgroundButton design={design} />
          <Link
            href={`/design/${design.id}`}
            className="flex items-center gap-1 text-caption font-medium text-white/80 hover:text-white transition-colors py-1"
          >
            View page <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Card Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-body font-medium text-foreground" title={design.vibeName ?? "Design"}>
            {design.vibeName ? `${design.vibeName} Design` : "Custom Design"}
          </span>
          <span className="shrink-0 font-mono text-body-sm font-semibold text-gold-leaf">
            {isUnlisted
              ? "Draft"
              : formatListingPrice(design.priceCents)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-caption text-muted-foreground">
            {formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="text-caption font-medium text-primary hover:underline"
          >
            {isUnlisted ? "List design" : "Edit settings"}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Cut the flat field off, or put it back.
 *
 *  Generation leaves the background on now, so this is where it comes off —
 *  after the maker has seen the artwork and decided it should. The cut is a
 *  paid model call and takes a few seconds; the restore is a column swap. */
function BackgroundButton({ design }: { design: MakerDesign }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isCut = design.originalImageUrl !== null

  return (
    <>
      {error && (
        <span className="w-full rounded-md bg-pitch/80 px-2 py-1 text-center text-caption text-white">
          {error}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="w-full"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = isCut
              ? await restoreDesignBackground(design.id)
              : await removeDesignBackground(design.id)
            if (result.error) setError(result.error)
          })
        }}
      >
        <Scissors className="mr-1.5 size-3.5" />
        {isPending
          ? isCut
            ? "Restoring…"
            : "Cutting…"
          : isCut
            ? "Restore background"
            : "Remove background"}
      </Button>
    </>
  )
}

function AdoptedDesignCard({
  design,
  index,
}: {
  design: AdoptedDesign
  index: number
}) {
  return (
    <Link
      href={`/design/${design.id}`}
      className={`group/card flex flex-col gap-3 animate-card-rise stagger-${Math.min(index, 13)}`}
    >
      <div className="glass-surface glass-surface-interactive relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover/card:shadow-xl group-hover/card:border-primary/40">
        <Image
          src={design.mockupUrl ?? design.imageUrl}
          alt={design.vibeName ?? "Design"}
          fill
          sizes="(min-width: 1024px) 240px, 45vw"
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        <span className="absolute top-3 left-3 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-caption font-medium text-purple-400 backdrop-blur-md shadow-sm">
          Adopted
        </span>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pitch/90 via-pitch/30 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100" />
        <div className="absolute inset-0 flex items-end justify-center p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
          <span className="glass-panel rounded-lg border border-border/60 px-4 py-2 text-body-sm font-medium text-foreground backdrop-blur-md shadow-md">
            View details
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-body font-medium text-foreground">
            {design.claimantHandle ? `@${design.claimantHandle}` : "Claimed"}
          </span>
          <span className="shrink-0 font-mono text-body-sm font-semibold text-gold-leaf">
            {formatCents(design.soldForCents)}
          </span>
        </div>
        <span className="truncate text-caption text-muted-foreground">
          {formatDistanceToNowStrict(new Date(design.createdAt), { addSuffix: true })}
        </span>
      </div>
    </Link>
  )
}
