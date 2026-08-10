"use client"

import { useMemo, useState } from "react"
import {
  Sparkles,
  ChevronDown,
  Check,
  Search,
  Palette,
} from "lucide-react"

import { STYLE_PRESETS, findStyle } from "@/lib/generation/styles"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Rich aesthetic category classification for the popover browser */
export type CategoryKey =
  | "all"
  | "popular"
  | "anime"
  | "graffiti"
  | "realistic"
  | "cyberpunk"
  | "tattoo"
  | "art"

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All Styles" },
  { key: "popular", label: "Popular" },
  { key: "anime", label: "Anime & Manga" },
  { key: "graffiti", label: "Graffiti & Stencil" },
  { key: "realistic", label: "Realistic & 3D" },
  { key: "cyberpunk", label: "Cyberpunk & Retro" },
  { key: "tattoo", label: "Tattoo & Blackwork" },
  { key: "art", label: "Fine Art & Vintage" },
]

/** Maps style slugs to visual category tags and preview gradient aesthetics */
const STYLE_META: Record<
  string,
  {
    category: CategoryKey
    badge: string
    previewGradient: string
    accentColor: string
  }
> = {
  "neo-traditional": {
    category: "popular",
    badge: "Default / Tattoo",
    previewGradient: "from-amber-600 via-teal-700 to-slate-900",
    accentColor: "#d97706",
  },
  "anime-cel": {
    category: "anime",
    badge: "90s Anime Cel",
    previewGradient: "from-cyan-500 via-pink-500 to-purple-800",
    accentColor: "#06b6d4",
  },
  "manga-ink": {
    category: "anime",
    badge: "Manga Screentone",
    previewGradient: "from-zinc-900 via-zinc-700 to-zinc-200",
    accentColor: "#18181b",
  },
  "mecha-key-visual": {
    category: "anime",
    badge: "Mecha Key Visual",
    previewGradient: "from-blue-600 via-red-600 to-slate-950",
    accentColor: "#2563eb",
  },
  "chibi-kawaii": {
    category: "anime",
    badge: "Chibi Sticker",
    previewGradient: "from-pink-400 via-rose-300 to-amber-200",
    accentColor: "#f43f5e",
  },
  "spray-stencil": {
    category: "graffiti",
    badge: "Street Stencil",
    previewGradient: "from-red-600 via-neutral-800 to-teal-500",
    accentColor: "#dc2626",
  },
  "woodcut-flash": {
    category: "graffiti",
    badge: "Poster Woodcut",
    previewGradient: "from-amber-700 via-red-900 to-teal-900",
    accentColor: "#b45309",
  },
  "comic-halftone": {
    category: "graffiti",
    badge: "Pop Halftone",
    previewGradient: "from-red-500 via-yellow-400 to-cyan-500",
    accentColor: "#ef4444",
  },
  "photoreal-render": {
    category: "realistic",
    badge: "Photoreal 3D",
    previewGradient: "from-slate-700 via-indigo-900 to-zinc-950",
    accentColor: "#475569",
  },
  "low-poly": {
    category: "realistic",
    badge: "Low Poly 3D",
    previewGradient: "from-indigo-600 via-purple-700 to-amber-500",
    accentColor: "#4f46e5",
  },
  "surreal-collage": {
    category: "realistic",
    badge: "Paper Collage",
    previewGradient: "from-amber-800 via-blue-900 to-stone-900",
    accentColor: "#92400e",
  },
  "cyberpunk-neon": {
    category: "cyberpunk",
    badge: "Cyberpunk Glow",
    previewGradient: "from-fuchsia-600 via-cyan-500 to-violet-950",
    accentColor: "#c026d3",
  },
  "chrome-y2k": {
    category: "cyberpunk",
    badge: "Y2K Chrome",
    previewGradient: "from-slate-300 via-sky-400 to-pink-500",
    accentColor: "#0284c7",
  },
  "pixel-art": {
    category: "cyberpunk",
    badge: "16-Bit Pixel",
    previewGradient: "from-emerald-600 via-blue-600 to-red-600",
    accentColor: "#059669",
  },
  "blackwork-tattoo": {
    category: "tattoo",
    badge: "Blackwork Tattoo",
    previewGradient: "from-black via-zinc-900 to-zinc-800",
    accentColor: "#000000",
  },
  irezumi: {
    category: "tattoo",
    badge: "Japanese Irezumi",
    previewGradient: "from-indigo-950 via-red-700 to-amber-600",
    accentColor: "#312e81",
  },
  "watercolour-bloom": {
    category: "art",
    badge: "Watercolour Wash",
    previewGradient: "from-indigo-400 via-rose-300 to-emerald-300",
    accentColor: "#6366f1",
  },
  "botanical-plate": {
    category: "art",
    badge: "Botanical Field",
    previewGradient: "from-emerald-800 via-amber-700 to-slate-900",
    accentColor: "#065f46",
  },
  "art-nouveau-panel": {
    category: "art",
    badge: "Art Nouveau",
    previewGradient: "from-amber-600 via-emerald-800 to-rose-900",
    accentColor: "#d97706",
  },
  "vintage-riso": {
    category: "art",
    badge: "Two-Colour Riso",
    previewGradient: "from-pink-500 via-blue-600 to-indigo-950",
    accentColor: "#ec4899",
  },
  "ink-wash": {
    category: "art",
    badge: "Sumi Ink Wash",
    previewGradient: "from-zinc-950 via-zinc-500 to-stone-200",
    accentColor: "#18181b",
  },
  "paper-cut": {
    category: "art",
    badge: "Paper Cutout",
    previewGradient: "from-orange-500 via-emerald-700 to-indigo-900",
    accentColor: "#f97316",
  },
  "folk-woodblock": {
    category: "art",
    badge: "Ukiyo-e Woodblock",
    previewGradient: "from-[#1e3a8a] via-[#b91c1c] to-[#d97706]",
    accentColor: "#1e3a8a",
  },
  "psychedelic-liquid": {
    category: "cyberpunk",
    badge: "60s Psychedelic",
    previewGradient: "from-amber-500 via-purple-600 to-lime-500",
    accentColor: "#f59e0b",
  },
}

export function StylePopoverPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (slug: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all")

  const selectedPreset = useMemo(
    () => findStyle(value) ?? findStyle("neo-traditional")!,
    [value],
  )

  const selectedMeta = STYLE_META[selectedPreset.slug] ?? {
    category: "popular",
    badge: "Preset",
    previewGradient: "from-amber-600 to-slate-900",
    accentColor: "#a3e635",
  }

  const filteredPresets = useMemo(() => {
    const list = STYLE_PRESETS.filter((preset) => {
      const meta = STYLE_META[preset.slug]
      const matchesCategory =
        activeCategory === "all" ||
        (activeCategory === "popular"
          ? ["neo-traditional", "anime-cel", "spray-stencil", "photoreal-render", "cyberpunk-neon", "blackwork-tattoo", "watercolour-bloom"].includes(preset.slug)
          : meta?.category === activeCategory)

      const searchLower = query.trim().toLowerCase()
      const matchesQuery =
        !searchLower ||
        preset.label.toLowerCase().includes(searchLower) ||
        preset.aesthetic.toLowerCase().includes(searchLower) ||
        meta?.badge.toLowerCase().includes(searchLower)

      return matchesCategory && matchesQuery
    })

    // Always sort default style ('neo-traditional') to the top/first
    return list.sort((a, b) => {
      if (a.slug === "neo-traditional") return -1
      if (b.slug === "neo-traditional") return 1
      return 0
    })
  }, [activeCategory, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-foreground bg-background p-3.5 shadow-[2px_2px_0px_0px_#262626] transition-all hover:bg-card disabled:opacity-50 outline-none text-left"
      >
        <div className="flex items-center gap-3">
          {/* Visual Thumbnail Badge */}
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-foreground/30 bg-gradient-to-br shadow-inner overflow-hidden",
              selectedMeta.previewGradient,
            )}
          >
            <div className="absolute inset-0 bg-black/20" />
            <Palette className="relative h-5 w-5 text-white drop-shadow-sm" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-body-sm font-semibold text-foreground">
              {selectedPreset.label}
            </span>
            <span className="text-caption text-muted-ink">
              {selectedMeta.badge} · Click to explore styles
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-muted-ink group-hover:text-foreground">
          <span className="text-caption font-medium hidden sm:inline-block">
            Change
          </span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="glass-surface z-50 flex w-[340px] sm:w-[480px] flex-col gap-3 rounded-2xl border-2 border-foreground bg-card p-4 text-foreground shadow-[4px_4px_0px_0px_#262626]"
      >
        {/* Popover Header */}
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-foreground" />
            <h3 className="text-body-sm font-semibold text-foreground">
              Select Art Direction Style
            </h3>
          </div>
          <span className="text-caption font-mono text-muted-ink">
            {STYLE_PRESETS.length} presets
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, graffiti, realistic, typo, tattoo..."
            className="rounded-xl border border-foreground/30 bg-background pl-9 text-caption focus-visible:border-foreground focus-visible:ring-0"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border pb-2.5">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-caption font-medium transition-all whitespace-nowrap",
                  active
                    ? "bg-foreground text-background font-semibold shadow-[1px_1px_0px_0px_#262626]"
                    : "text-muted-ink hover:bg-background hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Grid of Styles */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {filteredPresets.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-caption text-muted-ink">
              No matching styles found for &quot;{query}&quot;
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const active = value === preset.slug
              const meta = STYLE_META[preset.slug] ?? {
                badge: "Preset",
                previewGradient: "from-slate-700 to-slate-900",
              }

              return (
                <button
                  key={preset.slug}
                  type="button"
                  onClick={() => {
                    onChange(preset.slug)
                    setOpen(false)
                  }}
                  className={cn(
                    "group relative aspect-[3/4] flex flex-col justify-between rounded-xl border p-2 text-left transition-all outline-none overflow-hidden",
                    active
                      ? "border-foreground bg-background shadow-[2px_2px_0px_0px_#262626] ring-1 ring-foreground"
                      : "border-border bg-card/50 hover:border-foreground/50 hover:bg-background",
                  )}
                >
                  {/* Style Preview Card Header 1:1 Square */}
                  <div
                    className={cn(
                      "relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br border border-foreground/20 p-2 flex items-end justify-between shadow-inner shrink-0",
                      meta.previewGradient,
                    )}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="relative text-[9px] font-semibold text-white/90 uppercase tracking-wider bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs line-clamp-1">
                      {meta.badge}
                    </span>
                    {active && (
                      <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#a3e635] text-foreground border border-foreground shadow shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="flex flex-col gap-0.5 pt-1.5 px-0.5">
                    <span className="text-caption font-semibold text-foreground line-clamp-1 leading-tight">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-muted-ink line-clamp-2 leading-tight">
                      {preset.aesthetic}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
