"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import type { VibeTile } from "@/lib/data/home"
import { SOCIAL_LINKS } from "@/components/layout/social-links"
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from "@/lib/generation/prompt"
import { stashHeroDraft } from "@/lib/hero-draft"
import { cn } from "@/lib/utils"

const INPUT_CLASS =
  "min-w-0 flex-1 rounded-lg border border-rule bg-transparent px-3 py-2.5 text-body-sm text-foreground placeholder-muted-gray transition focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"

function SocialBtn({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      // Column keeps social marks monochrome — the reference's pink/orange/blue
      // chip set would spend accent color on decoration.
      className="flex size-8 items-center justify-center rounded-lg bg-secondary text-ink transition-opacity hover:opacity-80"
    >
      {children}
    </a>
  )
}

export function HeroPromptForm({ vibes }: { vibes: VibeTile[] }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  // Single-select: /api/generate takes one vibeId, so a multi-select set here
  // would be a promise the backend can't keep.
  const [vibeId, setVibeId] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  const tooShort = prompt.trim().length < MIN_PROMPT_LENGTH

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (tooShort || leaving) return

    setLeaving(true)

    // Two carriers on purpose: the query string covers signed-in visitors, the
    // stash survives the /login bounce that strips it for everyone else.
    stashHeroDraft({ prompt: prompt.trim(), vibeId })

    const params = new URLSearchParams({ prompt: prompt.trim() })
    if (vibeId) params.set("vibe", vibeId)
    router.push(`/create?${params.toString()}`)
  }

  return (
    <div className="w-full shrink-0 lg:w-[min(480px,45%)]">
      <div className="flex flex-col gap-3 overflow-hidden rounded-xl bg-card p-4 shadow-[var(--shadow-xl-2)] sm:gap-4 sm:p-6">
        <h2 className="text-heading-sm text-foreground">Claim your 1-of-1</h2>

        <div className="hidden flex-row items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-2.5 sm:flex">
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">
              Already claiming?
            </p>
            <Link
              href="/login"
              className="truncate text-body-sm font-medium text-primary hover:underline"
            >
              Sign in to your storefront
            </Link>
          </div>

          {/* Same rule as the footer: an unset profile renders nothing rather
              than a dead link, so this row is empty until real URLs land. */}
          <div className="flex shrink-0 items-center gap-1.5">
            {SOCIAL_LINKS.filter((social) => social.href).map((social) => (
              <SocialBtn
                key={social.label}
                href={social.href!}
                label={`Shirt Bazaar on ${social.label}`}
              >
                {social.icon}
              </SocialBtn>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="h-px flex-1 bg-border" />
          <span className="text-body-sm font-medium text-muted-gray">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="hero-prompt"
              className="text-body-sm font-medium text-foreground"
            >
              Describe your design
            </label>
            <textarea
              id="hero-prompt"
              rows={3}
              value={prompt}
              onChange={(e) =>
                setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))
              }
              placeholder="A hooded elder weighing two planets on a golden scale…"
              className={cn(INPUT_CLASS, "resize-none sm:min-h-[7rem]")}
            />
            <p className="font-mono text-caption text-muted-foreground">
              {prompt.trim().length}/{MAX_PROMPT_LENGTH} · we handle the art
              direction
            </p>
          </div>

          {vibes.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="hidden text-body-sm font-medium text-foreground sm:inline">
                Pick a vibe
              </span>
              {/* One scrolling row on a phone, wrapped rows from sm up: the
                  second wrapped row cost 44px of a budget that had none. */}
              <div className="no-scrollbar -mx-4 flex flex-nowrap gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {vibes.map((vibe) => {
                  const active = vibeId === vibe.id
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      aria-pressed={active}
                      // Re-clicking clears it: a vibe is optional to the API and
                      // there'd otherwise be no way back to "no vibe".
                      onClick={() => setVibeId(active ? null : vibe.id)}
                      className={cn(
                        // Pill Tag: tags and status indicators are the only things
                        // Brainfish lets go fully round.
                        // `whitespace-nowrap` matters in the single scrolling
                        // row: without it "Dusk Atelier" breaks onto two lines
                        // and every chip inherits the taller row.
                        "rounded-full border border-ink px-3 py-1.5 text-caption font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-ink text-white"
                          : "bg-transparent text-ink hover:bg-secondary"
                      )}
                    >
                      {vibe.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={tooShort || leaving}
            className="btn-ember w-full py-3 text-body-sm font-medium disabled:opacity-60"
          >
            {leaving ? "Taking you there…" : "Generate my design"}
          </button>

          <p className="line-clamp-2 text-caption text-muted-foreground sm:line-clamp-none">
            Your design is private until you list it. Once someone claims one,
            it&apos;s theirs for good.
          </p>

          {/* Mobile only: the sign-in row above is hidden at this width, and the
              hero's own nav has no sign-in, so without this a returning visitor
              has no way in until they scroll to the global bar. */}
          <Link
            href="/login"
            className="text-caption text-muted-foreground underline decoration-border underline-offset-2 sm:hidden"
          >
            Already claiming? Sign in
          </Link>
        </form>
      </div>
    </div>
  )
}
