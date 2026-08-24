"use client"

import { useState } from "react"
import Link from "next/link"
import { ShirtIcon, Sparkles, Award, Layers } from "lucide-react"

import type { StorefrontData } from "@/lib/data/storefront"
import { DesignCard } from "@/components/shared/DesignCard"

export function StorefrontGrid({ data }: { data: StorefrontData }) {
  const [activeTab, setActiveTab] = useState<"all" | "claimed" | "created">("all")

  const hasClaimed = data.designs.length > 0
  const hasCreated = data.createdDesigns.length > 0

  if (!hasClaimed && !hasCreated) {
    return (
      <div className="rounded-[var(--sf-radius)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] bg-[var(--sf-surface)] p-12 text-center shadow-[var(--sf-shadow)] flex flex-col items-center justify-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full border-[length:var(--sf-border,1px)] border-[var(--sf-btn-line)] bg-[var(--sf-btn-bg)] text-[var(--sf-btn-ink)] shadow-[var(--sf-shadow-sm)]">
          <ShirtIcon className="size-6" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-heading-sm font-bold text-[var(--sf-ink)]">No 1-of-1 apparel yet</h3>
          <p className="text-body-sm text-[var(--sf-muted)]">
            Designs @{data.profile.handle} creates or claims will appear here in their broadsheet catalogue.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-[var(--sf-radius-sm,4px)] bg-[var(--sf-ink)] px-5 py-2 text-caption font-semibold text-[var(--sf-on-ink)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] shadow-[var(--sf-shadow-sm)] hover:opacity-90"
        >
          Browse Bazaar Marketplace
        </Link>
      </div>
    )
  }

  // Filter items based on activeTab
  const showClaimed = activeTab === "all" || activeTab === "claimed"
  const showCreated = activeTab === "all" || activeTab === "created"

  return (
    <div className="flex flex-col gap-8">
      {/* Broadsheet Tab Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-[length:var(--sf-border,1px)] border-[var(--sf-ink)] pb-4">
        <div className="flex items-center gap-2 rounded-[var(--sf-radius)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] bg-[var(--sf-surface)] p-1 shadow-[var(--sf-shadow)]">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-1.5 rounded-[var(--sf-radius-sm,4px)] px-4 py-1.5 text-caption font-mono font-semibold transition-all ${
              activeTab === "all"
                ? "bg-[var(--sf-btn-bg)] text-[var(--sf-btn-ink)] border-[length:var(--sf-border,1px)] border-[var(--sf-btn-line)] shadow-[var(--sf-shadow-sm)]"
                : "text-[var(--sf-muted)] hover:text-[var(--sf-ink)]"
            }`}
          >
            <Layers className="size-3.5" />
            All ({data.designs.length + data.createdDesigns.length})
          </button>

          {hasClaimed && (
            <button
              type="button"
              onClick={() => setActiveTab("claimed")}
              className={`inline-flex items-center gap-1.5 rounded-[var(--sf-radius-sm,4px)] px-4 py-1.5 text-caption font-mono font-semibold transition-all ${
                activeTab === "claimed"
                  ? "bg-[var(--sf-btn-bg)] text-[var(--sf-btn-ink)] border-[length:var(--sf-border,1px)] border-[var(--sf-btn-line)] shadow-[var(--sf-shadow-sm)]"
                  : "text-[var(--sf-muted)] hover:text-[var(--sf-ink)]"
              }`}
            >
              <Award className="size-3.5" />
              Claimed Vault ({data.designs.length})
            </button>
          )}

          {hasCreated && (
            <button
              type="button"
              onClick={() => setActiveTab("created")}
              className={`inline-flex items-center gap-1.5 rounded-[var(--sf-radius-sm,4px)] px-4 py-1.5 text-caption font-mono font-semibold transition-all ${
                activeTab === "created"
                  ? "bg-[var(--sf-btn-bg)] text-[var(--sf-btn-ink)] border-[length:var(--sf-border,1px)] border-[var(--sf-btn-line)] shadow-[var(--sf-shadow-sm)]"
                  : "text-[var(--sf-muted)] hover:text-[var(--sf-ink)]"
              }`}
            >
              <Sparkles className="size-3.5" />
              Created ({data.createdDesigns.length})
            </button>
          )}
        </div>

        <span className="text-caption font-mono text-[var(--sf-muted)] uppercase tracking-wider hidden sm:inline">
          1-of-1 Broadsheet Catalogue
        </span>
      </div>

      {/* Claimed Vault Section */}
      {showClaimed && hasClaimed && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-sm font-bold text-[var(--sf-ink)] tracking-tight">
              Claimed <span className="font-serif italic font-normal text-[var(--sf-ink)]">Vault</span>
            </h2>
            <span className="rounded-full border-[length:var(--sf-border,1px)] border-[var(--sf-btn-line)] bg-[var(--sf-btn-bg)] px-3 py-0.5 text-caption font-mono font-semibold text-[var(--sf-btn-ink)]">
              {data.designs.length} CLAIMED
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.designs.map((design, index) => (
              <DesignCard key={design.id} design={design} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Created Collection Section */}
      {showCreated && hasCreated && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-sm font-bold text-[var(--sf-ink)] tracking-tight">
              Created <span className="font-serif italic font-normal text-[var(--sf-ink)]">Collection</span>
            </h2>
            <span className="rounded-full border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] bg-[var(--sf-surface)] px-3 py-0.5 text-caption font-mono font-semibold text-[var(--sf-ink)]">
              {data.createdDesigns.length} ITEMS
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.createdDesigns.map((design, index) => (
              <DesignCard key={design.id} design={design} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
