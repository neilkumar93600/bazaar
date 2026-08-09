"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"

import { createClient } from "@/lib/supabase/client"
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from "@/lib/generation/prompt"
import {
  findStyle,
  validateStyleText,
  validateQuote,
  MAX_TEXT_CHARS,
  MAX_TEXT_WORDS,
  MAX_TITLE_CHARS,
  MAX_QUOTE_CHARS,
  DEFAULT_STYLE_SLUG,
} from "@/lib/generation/styles"
import type { AspectRatio, Quality } from "@/lib/generation/adapter"
import { clearHeroDraft, readHeroDraft } from "@/lib/hero-draft"
import { cn } from "@/lib/utils"
import type { GarmentOption } from "@/app/dashboard/designs/garment-options"
import { ListingForm } from "@/components/dashboard/ListingForm"
import { StylePicker } from "@/components/create/StylePicker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

const POLL_INTERVAL_MS = 2000
/** Give up rather than spin forever. The platform can kill the background work
 *  mid-flight, which leaves the row on `generating` with nothing coming. */
const POLL_CEILING_MS = 240_000

const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square" },
  { value: "3:4", label: "Portrait" },
  { value: "4:3", label: "Wide" },
]

const QUALITY_OPTIONS: { value: Quality; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

type Landed = { id: string; imageUrl: string }

type Phase =
  | { step: "idle" }
  | { step: "generating"; partial: Landed[] }
  | { step: "done"; designs: Landed[] }
  | { step: "failed"; message: string }

/** Chip row shared by aspect and quality — two tiny single-select controls that
 *  would otherwise be two near-identical blocks of markup. */
function ChipRow<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border border-ink px-3 py-1.5 text-caption font-medium whitespace-nowrap transition-colors disabled:opacity-50",
              active
                ? "bg-ink text-white"
                : "bg-transparent text-ink hover:bg-secondary",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function CreateForm({
  initialPrompt = null,
  initialStyleSlug = null,
  imagesPerJob,
  dailyImageCap,
  garmentOptions,
}: {
  /** From `?prompt=` — the home hero's handoff for a signed-in visitor. */
  initialPrompt?: string | null
  /** From `?vibe=`, translated to a style server-side. Ignored unless it names
   *  a real preset, so a stale or edited value can't select nothing. */
  initialStyleSlug?: string | null
  /** Both come from the server rather than being imported: `quota.ts` reads a
   *  server-only env var, and a client bundle would silently see the default. */
  imagesPerJob: number
  dailyImageCap: number
  /** Passed straight through to the listing panel. Read server-side because
   *  Printify's catalogue needs the API token. */
  garmentOptions: GarmentOption[]
}) {
  const [prompt, setPrompt] = useState(
    () => initialPrompt?.slice(0, MAX_PROMPT_LENGTH) ?? "",
  )
  const [styleSlug, setStyleSlug] = useState(() =>
    initialStyleSlug && findStyle(initialStyleSlug)
      ? initialStyleSlug
      : DEFAULT_STYLE_SLUG,
  )
  const [text, setText] = useState("")
  const [quote, setQuote] = useState("")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4")
  const [quality, setQuality] = useState<Quality>("medium")
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>({ step: "idle" })

  const style = findStyle(styleSlug)
  const isTypographic = style?.family === "typographic"
  const isIllustrated = style?.family === "illustrated"
  // Both families need words; only the poster styles need a second line.
  const needsWords = isTypographic || isIllustrated

  // A signed-out visitor who submitted the hero form was bounced through
  // /login, which dropped the query string. The draft rode along in
  // sessionStorage instead; pick it up once, then clear it so a later visit to
  // this page starts empty. Skipped entirely when the URL already carried a
  // prompt.
  //
  // Only the prompt is restored. The draft also carries a vibe id, but the form
  // no longer takes a vibe — a style carries its own — and translating an id to
  // a slug needs the vibes table, which this component does not have. The
  // signed-in path (?vibe=) does that translation server-side.
  //
  // Mount-only, and it has to be an effect: sessionStorage doesn't exist during
  // the server render, so seeding this in `useState` would make the server and
  // the first client pass disagree.
  useEffect(() => {
    const draft = readHeroDraft()
    clearHeroDraft()
    if (initialPrompt || !draft) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrompt(draft.prompt.slice(0, MAX_PROMPT_LENGTH))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Held in a ref so the unmount cleanup can always cancel the in-flight poll,
  // whatever the current phase is.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const pollJob = useCallback((jobId: string) => {
    const supabase = createClient()
    const startedAt = Date.now()

    const tick = async () => {
      if (Date.now() - startedAt > POLL_CEILING_MS) {
        setPhase({
          step: "failed",
          message:
            "This is taking longer than expected. Check your designs in a moment.",
        })
        return
      }

      // Both reads every tick: the job carries the terminal state, the designs
      // carry what has actually landed. Four images finish at different times,
      // so the grid fills in as they arrive rather than all at once.
      const [{ data: job }, { data: designs }] = await Promise.all([
        supabase
          .from("generation_jobs")
          .select("status")
          .eq("id", jobId)
          .maybeSingle(),
        supabase
          .from("designs")
          .select("id, image_url")
          .eq("generation_job_id", jobId)
          .order("created_at", { ascending: true }),
      ])

      const landed: Landed[] = (designs ?? []).map((d) => ({
        id: d.id,
        imageUrl: d.image_url,
      }))

      if (job?.status === "failed") {
        setPhase({
          step: "failed",
          message: "Generation failed. Try a different idea.",
        })
        return
      }

      if (job?.status === "done") {
        setPhase({ step: "done", designs: landed })
        return
      }

      setPhase({ step: "generating", partial: landed })
      timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
    }

    timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!style) return

    // Client-side only to save a round trip — /api/generate re-validates, and
    // that is the boundary that counts.
    const textCheck = validateStyleText(style, text)
    if (!textCheck.ok) {
      setPhase({ step: "failed", message: textCheck.error })
      return
    }

    const quoteCheck = validateQuote(style, quote)
    if (!quoteCheck.ok) {
      setPhase({ step: "failed", message: quoteCheck.error })
      return
    }

    setPicked(null)
    setPhase({ step: "generating", partial: [] })

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        styleSlug,
        text: textCheck.text ?? "",
        quote: quoteCheck.text ?? "",
        aspectRatio,
        quality,
      }),
    })

    const payload = (await response.json().catch(() => null)) as {
      jobId?: string
      error?: string
    } | null

    if (!response.ok || !payload?.jobId) {
      setPhase({
        step: "failed",
        message: payload?.error ?? "Could not start generation.",
      })
      return
    }

    pollJob(payload.jobId)
  }

  const busy = phase.step === "generating"
  const tooShort = prompt.trim().length < MIN_PROMPT_LENGTH

  const landed =
    phase.step === "done"
      ? phase.designs
      : phase.step === "generating"
        ? phase.partial
        : []

  // Placeholders only while work is still in flight. On `done` the grid shows
  // exactly what landed — fewer than four is a normal outcome, not an error.
  const slots =
    phase.step === "generating"
      ? Math.max(imagesPerJob, landed.length)
      : landed.length

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length

  // The listing panel needs the artwork for its preview, not just the id.
  const pickedDesign = landed.find((design) => design.id === picked) ?? null

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-6 lg:max-w-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="prompt">Your idea</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
            placeholder={
              isIllustrated
                ? "What the picture shows — a chained titan holding fire"
                : isTypographic
                  ? "How the words should feel — chunky, stacked, hand-drawn…"
                  : "A hooded elder weighing two planets on a golden scale"
            }
            rows={3}
            disabled={busy}
          />
          <p className="text-caption text-muted-foreground">
            {prompt.trim().length}/{MAX_PROMPT_LENGTH} ·{" "}
            {isIllustrated
              ? "this is the illustration between the title and the line"
              : isTypographic
                ? "this directs how your words are set"
                : "we handle the art direction"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Style</Label>
          <StylePicker value={styleSlug} onChange={setStyleSlug} disabled={busy} />
        </div>

        {needsWords && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="text">
              {isIllustrated ? "Title" : "Your words"}
            </Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isIllustrated ? "PROMETHEUS" : "stay weird"}
              disabled={busy}
            />
            <p
              className={cn(
                "text-caption",
                (isIllustrated
                  ? text.trim().length > MAX_TITLE_CHARS
                  : wordCount > MAX_TEXT_WORDS ||
                    text.trim().length > MAX_TEXT_CHARS)
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {isIllustrated
                ? `${text.trim().length}/${MAX_TITLE_CHARS} characters · one or two words reads best`
                : `${wordCount}/${MAX_TEXT_WORDS} words · ${text.trim().length}/${MAX_TEXT_CHARS} characters`}
              {" · spelling can miss, so pick the one that got it right"}
            </p>
          </div>
        )}

        {isIllustrated && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="quote">The line underneath</Label>
            <Input
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="THEY CHAINED THE BODY THE FIRE SPREAD"
              disabled={busy}
            />
            <p
              className={cn(
                "text-caption",
                quote.trim().length > MAX_QUOTE_CHARS
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {quote.trim().length}/{MAX_QUOTE_CHARS} characters
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="persona">Persona</Label>
          <NativeSelect id="persona" className="w-full" disabled>
            <option>No personas yet</option>
          </NativeSelect>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Shape</Label>
            <ChipRow
              options={ASPECT_OPTIONS}
              value={aspectRatio}
              onChange={setAspectRatio}
              disabled={busy}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Quality</Label>
            <ChipRow
              options={QUALITY_OPTIONS}
              value={quality}
              onChange={setQuality}
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            disabled={busy || tooShort}
            className="btn-ember w-fit rounded-full"
          >
            {busy ? "Generating…" : `Generate ${imagesPerJob} designs`}
          </Button>
          <p className="text-caption text-muted-foreground">
            Up to {dailyImageCap} images a day.
          </p>
        </div>

        {phase.step === "failed" && (
          <p className="text-body-sm text-destructive">{phase.message}</p>
        )}

        <p className="text-caption text-muted-foreground">
          Designs are private to you until you list them. Once someone claims
          one, it&apos;s theirs — you can&apos;t relist or resell it.
        </p>
      </form>

      <div className="flex w-full flex-col gap-4 lg:max-w-lg">
        {slots > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: slots }, (_, index) => {
              const design = landed[index]

              if (!design) {
                return (
                  <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
                )
              }

              const isPicked = picked === design.id
              return (
                <button
                  key={design.id}
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => setPicked(design.id)}
                  className={cn(
                    "relative aspect-[4/5] w-full overflow-hidden rounded-2xl border bg-card outline-none transition",
                    isPicked
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-primary/60",
                  )}
                >
                  <Image
                    src={design.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 256px, 45vw"
                    className="object-cover"
                  />
                </button>
              )
            })}
          </div>
        )}

        {phase.step === "generating" && (
          <p className="text-body-sm text-muted-foreground">
            Drawing {imagesPerJob} designs. This takes up to a couple of minutes
            — they appear as they finish.
          </p>
        )}

        {phase.step === "done" && !picked && (
          <p className="text-body-sm text-muted-foreground">
            Pick the one you want to list. The rest stay private in your
            designs.
          </p>
        )}

        {pickedDesign && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-body-sm text-muted-foreground">
              Pick what it prints on, then list it — or leave it and decide
              later.
            </p>
            <ListingForm
              designId={pickedDesign.id}
              imageUrl={pickedDesign.imageUrl}
              isListed={false}
              priceCents={null}
              garmentOptions={garmentOptions}
              // Freshly generated: nothing has been minted for it yet.
              frozen={false}
              initialConfig={{
                garmentSlug: null,
                variantId: null,
                placement: null,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
