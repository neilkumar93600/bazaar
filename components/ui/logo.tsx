import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The mark's geometry, written once.
 *
 *  "1/1" — the edition notation the art world uses for a unique piece, and the
 *  string already printed on every card in the bazaar. Drawn rather than set:
 *  the numerals are reduced to bars of the same weight as the slash, so the
 *  mark reads as the rhythm bar-slash-bar and stays a solid block at favicon
 *  size, where real numerals would break up.
 *
 *  Every surface renders these three paths. A logo that is retyped per surface
 *  drifts, and `app/icon.svg` and `public/logo-icon.svg` carry the same three
 *  `d` strings for the same reason — those two cannot import from here. */
const MARK_VIEWBOX = "0 0 104 100";
const MARK_PATHS = [
  // Leading 1 — stem plus the flag that keeps it a numeral and not a bare bar.
  // The flag is the only asymmetry in the mark.
  "M0 0H32V100H8V19H0V0Z",
  // The slash, same horizontal weight as both stems. Its foot crosses into the
  // leading 1 so the three strokes lock as one block rather than reading as
  // three spaced characters.
  "M53 0H74L51 100H30L53 0Z",
  // Trailing 1 — no flag. Reducing it to a plain bar is what turns the pair
  // into a mark rather than two numerals side by side.
  "M80 0H104V100H80V0Z",
];

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function LogoIcon({ className, ...props }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={MARK_VIEWBOX}
      fill="none"
      role="img"
      aria-label="1 of 1"
      className={cn("w-[21px] h-[20px] shrink-0", className)}
      {...props}
    >
      <g id="logomark" fill="currentColor">
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

export interface LogoBadgeProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/** The mark as a struck stamp: lime on an ink tile, matching `app/icon.svg`.
 *
 *  This is the one place lime fills the mark. DESIGN.md rations lime to
 *  actions and forbids it as a UI icon fill, but the app icon has always been
 *  the exception — it is a stamp rather than an icon in a row of controls, and
 *  it is where the brand gets to shout. Use it for avatars, share cards and
 *  app surfaces; use `LogoIcon` anywhere the mark sits inside the interface. */
export function LogoBadge({ className, ...props }: LogoBadgeProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      role="img"
      aria-label="1 of 1"
      className={cn("size-8 shrink-0", className)}
      {...props}
    >
      <rect width="100" height="100" rx="22" fill="#262626" />
      <g transform="translate(21.4, 22.5) scale(0.55)" fill="#A3E635">
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

export interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  href = "/",
}: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoIcon className={cn("text-foreground", iconClassName)} />
      {showText && (
        <span
          className={cn(
            "text-lg font-black tracking-tight text-foreground font-sans uppercase",
            textClassName
          )}
        >
          SHIRT BAZAAR
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
