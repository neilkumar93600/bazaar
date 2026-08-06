import { cn } from "@/lib/utils"

/** The hamburger, and its morph into a close mark.
 *
 *  Three ink rules: the outer two slide to the centre and cross, the middle one
 *  fades out under them. Shared by the global navbar and the hero's own pill so
 *  the gesture is identical in both places.
 *
 *  Every bar is positioned once and animated with `transform` and `opacity`
 *  only — no `top`/`margin` transitions, so the whole thing stays on the
 *  compositor and can't cause layout work mid-animation. The `-50%` has to ride
 *  along inside each transform, since setting `transform` at all would otherwise
 *  drop the centring. */
export function MenuToggle({
  open,
  className,
}: {
  open: boolean
  className?: string
}) {
  const bar =
    "absolute top-1/2 left-0 h-[1.5px] w-4 rounded-full bg-current transition-transform duration-200 ease-out motion-reduce:transition-none"

  return (
    <span aria-hidden className={cn("relative block size-4", className)}>
      <span
        className={cn(
          bar,
          open
            ? "[transform:translateY(-50%)_rotate(45deg)]"
            : "[transform:translateY(calc(-50%-5px))]"
        )}
      />
      <span
        className={cn(
          "absolute top-1/2 left-0 h-[1.5px] w-4 rounded-full bg-current [transform:translateY(-50%)] transition-opacity duration-150 motion-reduce:transition-none",
          open ? "opacity-0" : "opacity-100"
        )}
      />
      <span
        className={cn(
          bar,
          open
            ? "[transform:translateY(-50%)_rotate(-45deg)]"
            : "[transform:translateY(calc(-50%+5px))]"
        )}
      />
    </span>
  )
}
