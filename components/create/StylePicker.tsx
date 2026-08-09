"use client"

import { STYLE_PRESETS, type StyleFamily } from "@/lib/generation/styles"
import { cn } from "@/lib/utils"

/** Chips, not a `<select>`: 24 options in a dropdown is unbrowsable, and the
 *  family split has to be visible because picking a text style changes what
 *  the form asks next. */
const GROUPS: { family: StyleFamily; label: string; hint: string }[] = [
  { family: "pictorial", label: "Picture", hint: "A drawn subject. No words." },
  { family: "typographic", label: "Words", hint: "Your text is the design." },
]

export function StylePicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (slug: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map((group) => (
        <div key={group.family} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-body-sm font-medium text-foreground">
              {group.label}
            </span>
            <span className="text-caption text-muted-foreground">
              {group.hint}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.filter((preset) => preset.family === group.family).map(
              (preset) => {
                const active = value === preset.slug
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={() => onChange(preset.slug)}
                    className={cn(
                      "rounded-full border border-ink px-3 py-1.5 text-caption font-medium whitespace-nowrap transition-colors disabled:opacity-50",
                      active
                        ? "bg-ink text-white"
                        : "bg-transparent text-ink hover:bg-secondary",
                    )}
                  >
                    {preset.label}
                  </button>
                )
              },
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
