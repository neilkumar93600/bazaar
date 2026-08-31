import React from "react"
import { LegalNav } from "./LegalNav"
import {
  LegalContentClient,
  type LegalMetadata,
  type LegalSectionItem,
} from "./LegalContentClient"

export type { LegalMetadata, LegalSectionItem }

export function LegalPageLayout({
  title,
  subtitle,
  metadata,
  sections,
}: {
  title: string
  subtitle: string
  metadata?: Partial<LegalMetadata>
  sections: LegalSectionItem[]
}) {
  const fullMetadata: LegalMetadata = {
    version: metadata?.version ?? "2.4",
    lastUpdated: metadata?.lastUpdated ?? "January 15, 2026",
    effectiveDate: metadata?.effectiveDate ?? "January 15, 2026",
    jurisdiction: metadata?.jurisdiction ?? "Delaware, United States",
    readingTime: metadata?.readingTime ?? "6 min read",
    contactEmail: metadata?.contactEmail ?? "legal@shirtbazaar.com",
    categoryBadge: metadata?.categoryBadge,
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="print:hidden">
        <LegalNav />
      </div>

      <LegalContentClient
        title={title}
        subtitle={subtitle}
        metadata={fullMetadata}
        sections={sections}
      />
    </div>
  )
}
