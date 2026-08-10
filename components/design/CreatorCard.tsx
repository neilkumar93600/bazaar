import Image from "next/image"
import Link from "next/link"

import type { DesignCreator } from "@/lib/data/design"

/** The maker, as a card: banner, avatar, name, handle, and the way through to
 *  their storefront. Sits beside the design on desktop and above the strip on
 *  a phone. */
export function CreatorCard({
  creator,
  designCount,
}: {
  creator: DesignCreator
  /** How many other listed designs they have. Omitted when zero. */
  designCount?: number
}) {
  return (
    // Cream sheet, 1px rule, no shadow — docs/DESIGN.md Cream Stat Card.
    // `shadow-xs` was a blurred Tailwind default, and this system has no
    // blurred shadows: every shadow is a 2px solid ink offset or it doesn't
    // exist. `glass-surface` is the codebase's name for that 1px ring.
    <div className="overflow-hidden rounded-xl border border-ink bg-card shadow-[var(--shadow-xl-2)]">
      {/* Banner, or default broadsheet pattern ground when they haven't set one. */}
      <div className="relative h-24 w-full border-b border-ink bg-[#262626] overflow-hidden">
        {creator.bannerUrl ? (
          <Image
            src={creator.bannerUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-[#262626] bg-[radial-gradient(#a3e635_1.5px,transparent_1.5px)] [background-size:16px_16px] flex items-center justify-end px-4 py-2 opacity-90">
            <span className="text-[10px] font-mono tracking-widest text-[#a3e635] uppercase bg-[#262626]/90 px-2.5 py-0.5 rounded border border-[#a3e635]/40 shadow-xs">
              STOREFRONT
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5 p-5">
        {/* Pulled up over the banner edge, the way a profile header sits. */}
        <div className="relative z-10 -mt-12 ml-1 flex items-end gap-3">
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              alt=""
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-full border-2 border-ink bg-paper-white object-cover shadow-[2px_2px_0_0_#262626]"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper-white text-heading-sm font-semibold text-ink shadow-[2px_2px_0_0_#262626]">
              {creator.handle.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="truncate text-body font-semibold text-ink">
            {creator.displayName ?? creator.handle}
          </span>
          <span className="truncate font-mono text-caption text-muted-gray">
            @{creator.handle}
            {designCount ? ` · ${designCount} listed` : ""}
          </span>
        </div>

        {creator.bio && (
          <p className="line-clamp-3 text-body-sm text-muted-ink">{creator.bio}</p>
        )}

        <Link
          href={`/creator/${creator.handle}`}
          className="flex h-10 w-full items-center justify-center rounded-lg border border-ink bg-paper-white px-4 text-body-sm font-medium text-ink transition-all hover:bg-accent hover:shadow-[1px_1px_0_0_#262626]"
        >
          Visit store
        </Link>
      </div>
    </div>
  )
}
