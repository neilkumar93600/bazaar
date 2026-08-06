import { cn } from "@/lib/utils"

/** Column's section label — "Tag with Dot": transparent, no rounding, 12px
 *  weight 500 uppercase with expanded tracking and a small colored dot for
 *  category. Reads as a label, not a chip, so it deliberately has no fill or
 *  radius of its own. */
export function SectionTag({
  children,
  dotClassName = "bg-ink",
  className,
}: {
  children: React.ReactNode
  /** Category color for the dot — seafoam by default, the data/product hue. */
  dotClassName?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-caption font-medium tracking-[0.08em] text-foreground uppercase",
        className
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dotClassName)} />
      {children}
    </span>
  )
}
