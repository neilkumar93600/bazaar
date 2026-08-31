"use client"

import React, { useState, useEffect, useMemo, useTransition } from "react"
import Link from "next/link"
import {
  Search,
  X,
  Link as LinkIcon,
  Check,
  Printer,
  ArrowUp,
  ChevronDown,
  Sparkles,
  Info,
  ExternalLink,
  BookOpen,
  Calendar,
  ShieldCheck,
  Scale,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { LEGAL_PAGES } from "./LegalNav"

export type LegalSectionItem = {
  id: string
  number?: string
  heading: string
  plainEnglishSummary?: string[]
  content: React.ReactNode
  searchKeywords?: string[]
}

export type LegalMetadata = {
  version: string
  lastUpdated: string
  effectiveDate: string
  jurisdiction: string
  readingTime: string
  contactEmail: string
  categoryBadge?: string
}

export function LegalContentClient({
  title,
  subtitle,
  metadata,
  sections,
}: {
  title: string
  subtitle: string
  metadata: LegalMetadata
  sections: LegalSectionItem[]
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [, startTransition] = useTransition()

  // Track scroll progress and active section
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)))
      }
      setShowBackToTop(window.scrollY > 400)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // IntersectionObserver for active section highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  // Filter sections by search
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sections

    return sections.filter((s) => {
      const inHeading = s.heading.toLowerCase().includes(q)
      const inSummary = s.plainEnglishSummary?.some((sum) => sum.toLowerCase().includes(q))
      const inKeywords = s.searchKeywords?.some((kw) => kw.toLowerCase().includes(q))
      return inHeading || inSummary || inKeywords
    })
  }, [searchQuery, sections])

  const copySectionLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const scrollToSection = (id: string) => {
    setMobileTocOpen(false)
    const el = document.getElementById(id)
    if (el) {
      const topOffset = 90
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      window.history.pushState(null, "", `#${id}`)
    }
  }

  return (
    <div className="relative font-sans text-ink">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 z-50 h-1 bg-lime-sprint transition-all duration-150 print:hidden"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Header Banner */}
      <header className="mb-10 flex flex-col gap-6 border-b border-rule pb-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted-gray">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-paper-white px-3 py-1 text-ink font-semibold">
            <Scale className="h-3.5 w-3.5" />
            Legal Documentation
          </span>
          <span className="text-rule">/</span>
          <span>Version {metadata.version}</span>
          <span className="text-rule">/</span>
          <span>Effective: {metadata.effectiveDate}</span>
          <span className="text-rule">/</span>
          <span>{metadata.jurisdiction}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-display text-ink font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-body text-muted-ink leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Document Metadata Ribbon in Cream Sheet */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-rule bg-cream p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-ink sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-ink" />
              <span>Last Updated: <strong className="text-ink">{metadata.lastUpdated}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink" />
              <span>Est. Read: <strong className="text-ink">{metadata.readingTime}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-ink" />
              <span>Governing Law: <strong className="text-ink">{metadata.jurisdiction}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink bg-paper-white px-3.5 py-1.5 text-xs font-medium text-ink transition-all hover:bg-lime-sprint hover:shadow-[2px_2px_0_0_#262626] active:translate-y-px"
              title="Print or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: TOC (Left Sticky) & Content (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] xl:gap-12">
        {/* Left Sticky Sidebar (Desktop) */}
        <aside className="hidden lg:block print:hidden">
          <div className="sticky top-24 flex flex-col gap-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-gray" />
              <input
                type="text"
                placeholder="Search clauses..."
                value={searchQuery}
                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                className="w-full rounded-[4px] border border-rule bg-paper-white pl-9 pr-8 py-2 text-xs text-ink placeholder:text-muted-gray focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-gray hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Table of Contents List */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between pb-2 text-[11px] font-mono uppercase tracking-wider text-muted-gray border-b border-rule">
                <span>Table of Contents</span>
                <span>{filteredSections.length} Sections</span>
              </div>

              <nav className="flex flex-col gap-1 pt-2">
                {filteredSections.map((s, idx) => {
                  const isActive = activeId === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={cn(
                        "group flex items-start gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-xs transition-all",
                        isActive
                          ? "border border-ink bg-lime-sprint font-semibold text-ink shadow-[2px_2px_0_0_#262626]"
                          : "border border-transparent text-muted-ink hover:border-rule hover:bg-cream hover:text-ink"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 font-mono text-[10px] shrink-0",
                          isActive ? "text-ink font-bold" : "text-muted-gray group-hover:text-ink"
                        )}
                      >
                        {s.number ?? (idx + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="line-clamp-2 leading-relaxed">{s.heading}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Legal Support Help Box */}
            <div className="rounded-[8px] border border-rule bg-cream p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Info className="h-4 w-4" />
                <span>Legal Counsel Inquiries</span>
              </div>
              <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                Direct statutory notices, commercial rights licensing, or DSR requests to our legal team.
              </p>
              <a
                href={`mailto:${metadata.contactEmail}`}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ink underline underline-offset-4 hover:opacity-80"
              >
                <span>{metadata.contactEmail}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </aside>

        {/* Mobile Sticky Table of Contents Header */}
        <div className="sticky top-16 z-30 flex flex-col gap-2 rounded-[8px] border border-ink bg-paper-white p-3 shadow-[2px_2px_0_0_#262626] lg:hidden print:hidden">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              type="button"
              className="flex flex-1 items-center justify-between rounded-[4px] border border-rule bg-cream px-3 py-2 text-xs font-medium text-ink"
            >
              <div className="flex items-center gap-2 truncate">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-ink" />
                <span className="truncate">
                  {sections.find((s) => s.id === activeId)?.heading || "Jump to section"}
                </span>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform duration-200", mobileTocOpen && "rotate-180")}
              />
            </button>

            <button
              onClick={() => window.print()}
              type="button"
              className="rounded-[4px] border border-ink p-2 text-ink hover:bg-cream"
              title="Print / Save PDF"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>

          {/* Collapsible Mobile TOC Menu */}
          {mobileTocOpen && (
            <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto border-t border-rule pt-2">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-gray" />
                <input
                  type="text"
                  placeholder="Filter sections..."
                  value={searchQuery}
                  onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                  className="w-full rounded-[4px] border border-rule bg-paper-white py-1.5 pl-8 pr-3 text-xs text-ink"
                />
              </div>

              {filteredSections.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs transition-colors",
                    activeId === s.id
                      ? "bg-lime-sprint font-semibold text-ink border border-ink"
                      : "text-muted-ink hover:bg-cream hover:text-ink"
                  )}
                >
                  <span className="font-mono text-[10px] opacity-70">
                    {s.number ?? (idx + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="truncate">{s.heading}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Main Content Area */}
        <main className="flex flex-col gap-10">
          {searchQuery && (
            <div className="flex items-center justify-between rounded-[8px] border border-rule bg-cream px-4 py-2.5 text-xs text-muted-ink print:hidden">
              <span>
                Showing <strong>{filteredSections.length}</strong> of {sections.length} sections matching &quot;{searchQuery}&quot;
              </span>
              <button
                onClick={() => setSearchQuery("")}
                type="button"
                className="font-medium text-ink underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          )}

          {filteredSections.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-rule bg-cream p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-gray/50" />
              <h3 className="mt-4 text-base font-semibold text-ink">No matching clauses found</h3>
              <p className="mt-1 text-xs text-muted-ink">
                Try searching for other keywords like &quot;royalty&quot;, &quot;reprint&quot;, &quot;license&quot;, or &quot;privacy&quot;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                type="button"
                className="mt-4 inline-flex items-center rounded-[4px] border border-ink bg-lime-sprint px-4 py-2 text-xs font-medium text-ink shadow-[2px_2px_0_0_#262626]"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredSections.map((section, idx) => (
              <section
                key={section.id}
                id={section.id}
                className="group relative flex flex-col gap-6 scroll-mt-24 rounded-[8px] border border-rule bg-paper-white p-6 sm:p-8 transition-all hover:border-ink hover:shadow-[2px_2px_0_0_#262626]"
              >
                {/* Section Header */}
                <div className="flex items-start justify-between gap-4 border-b border-rule pb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-rule bg-cream font-mono text-xs font-semibold text-ink">
                      {section.number ?? (idx + 1).toString().padStart(2, "0")}
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                      {section.heading}
                    </h2>
                  </div>

                  <button
                    onClick={() => copySectionLink(section.id)}
                    type="button"
                    title="Copy link to this section"
                    aria-label={`Copy link to section ${section.heading}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-rule bg-cream px-2.5 text-xs font-medium text-muted-ink transition-all hover:border-ink hover:bg-paper-white hover:text-ink hover:shadow-[2px_2px_0_0_#262626] active:translate-y-px print:hidden cursor-pointer"
                  >
                    {copiedId === section.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-ink" />
                        <span className="hidden sm:inline font-mono">Copied</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline font-mono">Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Plain English TL;DR Callout Box (Cream Sheet) */}
                {section.plainEnglishSummary && section.plainEnglishSummary.length > 0 && (
                  <div className="rounded-[8px] border border-rule bg-cream p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink uppercase tracking-wider font-mono">
                      <Sparkles className="h-3.5 w-3.5 text-ink" />
                      <span>Key Takeaways (In Plain English)</span>
                    </div>
                    <ul className="mt-3 flex flex-col gap-2 pl-4 text-xs sm:text-sm text-ink list-disc leading-relaxed">
                      {section.plainEnglishSummary.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Formal Legal Clause Content */}
                <div className="prose prose-sm max-w-none text-muted-ink leading-relaxed space-y-4 [&_p]:text-sm sm:[&_p]:text-[15px] [&_p]:leading-relaxed [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:text-sm sm:[&_li]:text-[15px] [&_li]:leading-relaxed [&_strong]:text-ink [&_strong]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-80 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-rule [&_th]:border [&_th]:border-rule [&_th]:bg-cream [&_th]:p-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-ink [&_td]:border [&_td]:border-rule [&_td]:p-3 [&_td]:text-xs [&_td]:text-muted-ink">
                  {section.content}
                </div>
              </section>
            ))
          )}

          {/* Footer Navigation Switcher Cards */}
          <div className="mt-8 rounded-[8px] border border-rule bg-cream p-6 sm:p-8 print:hidden">
            <h3 className="text-base font-semibold text-ink">Explore Other Policies</h3>
            <p className="mt-1 text-xs text-muted-ink">
              Our complete legal framework is composed of complementary, binding policies.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEGAL_PAGES.map((p) => {
                const Icon = p.icon
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="group flex flex-col gap-2 rounded-[8px] border border-rule bg-paper-white p-4 transition-all hover:border-ink hover:shadow-[2px_2px_0_0_#262626]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-rule bg-cream group-hover:bg-lime-sprint group-hover:border-ink transition-colors">
                        <Icon className="h-4 w-4 text-ink" />
                      </div>
                      <span className="font-mono text-[10px] text-muted-gray">{p.badge}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink group-hover:underline">
                        {p.label}
                      </h4>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Back to Top Button with Hard Offset Shadow */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          type="button"
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-[4px] border border-ink bg-paper-white text-ink shadow-[2px_2px_0_0_#262626] transition-all hover:bg-lime-sprint active:translate-y-px active:shadow-none print:hidden cursor-pointer"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
