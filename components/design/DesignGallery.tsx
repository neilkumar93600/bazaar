"use client"

import { useState } from "react"
import Image from "next/image"

/** The design's image, with the shirt/artwork toggle when both exist.
 *
 *  Lifted out of the old dialog so the page can own the layout. The two views
 *  are genuinely different things and the buyer needs both: the mockup is what
 *  the garment looks like, the artwork is what they actually buy.
 */
export function DesignGallery({
  imageUrl,
  mockupUrl,
  alt,
}: {
  imageUrl: string
  mockupUrl: string | null
  alt: string
}) {
  const [view, setView] = useState<"mockup" | "artwork">(
    mockupUrl ? "mockup" : "artwork"
  )

  const current = view === "mockup" && mockupUrl ? mockupUrl : imageUrl

  return (
    // No width cap: the page gives this half the grid, which is already the
    // right size for it.
    <div className="flex w-full flex-col gap-3">
      {/* Feature Mockup Card: 8px radius, 1px solid ink border, 2px hard offset shadow */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-ink bg-card shadow-[var(--shadow-xl-2)] sm:aspect-square">
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 640px, 100vw"
          priority
          className="object-contain transition-all duration-300"
        />
      </div>

      {mockupUrl && (
        <div className="flex items-center gap-3">
          <Thumb
            src={mockupUrl}
            label="Shirt"
            active={view === "mockup"}
            onClick={() => setView("mockup")}
          />
          <Thumb
            src={imageUrl}
            label="Art"
            active={view === "artwork"}
            onClick={() => setView("artwork")}
          />
        </div>
      )}
    </div>
  )
}

function Thumb({
  src,
  label,
  active,
  onClick,
}: {
  src: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative aspect-[4/5] w-16 overflow-hidden rounded-lg border transition-all ${
        active
          ? "border-ink shadow-[1px_1px_0_0_#262626] opacity-100"
          : "border-border opacity-70 hover:opacity-100 hover:border-ink"
      }`}
    >
      <Image src={src} alt={label} fill sizes="64px" className="object-cover" />
      <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[10px] font-medium text-white">
        {label}
      </span>
    </button>
  )
}
