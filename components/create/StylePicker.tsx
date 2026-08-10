"use client"

import { motion } from "framer-motion"
import { STYLE_PRESETS, type StyleFamily } from "@/lib/generation/styles"
import { cn } from "@/lib/utils"

const GROUPS: { family: StyleFamily; label: string; hint: string }[] = [
  { family: "pictorial", label: "Picture", hint: "A drawn subject. No words." },
  { family: "typographic", label: "Words", hint: "Your text is the design." },
  {
    family: "illustrated",
    label: "Poster",
    hint: "A title, a picture and a line underneath.",
  },
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
            <span className="text-body-sm font-semibold text-foreground">
              {group.label}
            </span>
            <span className="text-caption text-muted-ink">
              {group.hint}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.filter((preset) => preset.family === group.family).map(
              (preset) => {
                const active = value === preset.slug
                return (
                  <motion.button
                    key={preset.slug}
                    type="button"
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={() => onChange(preset.slug)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative rounded-full border px-3 py-1.5 text-caption font-medium whitespace-nowrap transition-all disabled:opacity-50",
                      active
                        ? "bg-foreground text-background border-foreground shadow-[2px_2px_0px_0px_#262626]"
                        : "bg-background text-foreground border-foreground/30 hover:border-foreground hover:bg-card",
                    )}
                  >
                    {preset.label}
                  </motion.button>
                )
              },
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
