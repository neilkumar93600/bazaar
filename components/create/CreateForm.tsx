"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Shirt,
  Wand2,
  AlertCircle,
  Info,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from "@/lib/generation/prompt"
import { findStyle, DEFAULT_STYLE_SLUG } from "@/lib/generation/styles"
import {
  PERSONA_PRESETS,
  DEFAULT_PERSONA_SLUG,
  savedPersonaValue,
} from "@/lib/generation/personas"
import type { AspectRatio, Quality } from "@/lib/generation/adapter"
import type { UserPersona } from "@/lib/data/personas"
import { clearHeroDraft, readHeroDraft } from "@/lib/hero-draft"
import { cn } from "@/lib/utils"
import type { GarmentOption } from "@/app/dashboard/designs/garment-options"
import { ListingForm } from "@/components/dashboard/ListingForm"
import { StylePopoverPicker } from "@/components/create/StylePopoverPicker"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOptGroup } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const POLL_INTERVAL_MS = 2000
const POLL_CEILING_MS = 240_000

type Landed = { id: string; imageUrl: string }

type Phase =
  | { step: "idle" }
  | { step: "generating"; partial: Landed[] }
  | { step: "done"; designs: Landed[] }
  | { step: "failed"; message: string }

export function CreateForm({
  initialPrompt = null,
  initialStyleSlug = null,
  imagesPerJob,
  dailyImageCap,
  garmentOptions,
  userPersonas = [],
}: {
  initialPrompt?: string | null
  initialStyleSlug?: string | null
  imagesPerJob: number
  dailyImageCap: number
  garmentOptions: GarmentOption[]
  userPersonas?: UserPersona[]
}) {
  const [prompt, setPrompt] = useState(() => {
    if (initialPrompt) return initialPrompt.slice(0, MAX_PROMPT_LENGTH)
    const draft = readHeroDraft()
    if (draft) {
      clearHeroDraft()
      return draft.prompt.slice(0, MAX_PROMPT_LENGTH)
    }
    return ""
  })
  const [styleSlug, setStyleSlug] = useState(() =>
    initialStyleSlug && findStyle(initialStyleSlug)
      ? initialStyleSlug
      : DEFAULT_STYLE_SLUG,
  )
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1")
  const [quality, setQuality] = useState<Quality>("medium")
  const [persona, setPersona] = useState(DEFAULT_PERSONA_SLUG)
  const [enhance, setEnhance] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>({ step: "idle" })

  const style = findStyle(styleSlug)

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
        // One image per job now, so there is nothing to choose between — the
        // listing panel opens on the design that landed instead of asking the
        // maker to pick it out of a grid of one.
        if (landed.length === 1) setPicked(landed[0].id)
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

    setPicked(null)
    setPhase({ step: "generating", partial: [] })

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        styleSlug,
        text: "",
        quote: "",
        aspectRatio,
        quality,
        persona,
        enhance,
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

  const slots =
    phase.step === "generating"
      ? Math.max(imagesPerJob, landed.length)
      : landed.length

  const pickedDesign = landed.find((design) => design.id === picked) ?? null

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      {/* Studio Controls Card Column */}
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-6 rounded-2xl border-2 border-foreground bg-card p-6 md:p-8 shadow-[2px_2px_0px_0px_#262626] lg:col-span-6"
      >
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Sliders className="h-5 w-5 text-foreground" />
          <h2 className="text-body-sm font-semibold text-foreground">
            Design Parameters
          </h2>
        </div>

        {/* 1. Prompt / Idea Input */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <Label htmlFor="prompt" className="text-body-sm font-semibold text-foreground">
              1. Your Idea / Concept
            </Label>
            <div className="flex shrink-0 items-center gap-1.5">
              <Label htmlFor="enhance-toggle" className="text-caption font-medium text-muted-ink">
                {enhance ? "Enhance on" : "Enhance off"}
              </Label>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="text-muted-ink hover:text-foreground"
                  aria-label="What enhance does"
                >
                  <Info className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  Enhance lets the AI take creative liberties — the design can
                  come out differently than what you pictured. Turn it off to
                  keep exactly what you typed.
                </TooltipContent>
              </Tooltip>
              <Switch
                id="enhance-toggle"
                size="sm"
                checked={enhance}
                onCheckedChange={setEnhance}
                disabled={busy}
              />
            </div>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
            placeholder="Describe what you want to render — e.g. a cybernetic panther perched on a neon pagoda in Tokyo rain, vibrant linework, dramatic rim lighting..."
            rows={4}
            disabled={busy}
            className="rounded-xl border-2 border-border bg-background p-3.5 text-body-sm transition-colors focus-visible:border-foreground focus-visible:ring-0 resize-y"
          />
          <div className="flex items-center justify-between text-caption text-muted-ink">
            <span>
              {enhance
                ? "AI expands your idea into full art direction."
                : "Off — your words go to the model exactly as typed."}
            </span>
            <span className="font-mono font-medium">
              {prompt.trim().length}/{MAX_PROMPT_LENGTH}
            </span>
          </div>
        </div>

        {/* 2. Style Popover Picker */}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Label className="text-body-sm font-semibold text-foreground">
            2. Art Direction & Style
          </Label>
          <StylePopoverPicker
            value={styleSlug}
            onChange={setStyleSlug}
            disabled={busy}
          />
        </div>

        {/* 3. Persona Selector */}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="persona" className="text-body-sm font-semibold text-foreground">
              3. Brand Persona
            </Label>
            <Link
              href="/dashboard/personas"
              className="text-caption font-medium text-primary underline-offset-4 hover:underline"
            >
              {userPersonas.length > 0 ? "Manage personas" : "Create from your designs"}
            </Link>
          </div>
          <NativeSelect
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            disabled={busy}
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-body-sm"
          >
            {userPersonas.length > 0 && (
              <NativeSelectOptGroup label="Your personas">
                {userPersonas.map((saved) => (
                  <option key={saved.id} value={savedPersonaValue(saved.id)}>
                    {saved.name}
                  </option>
                ))}
              </NativeSelectOptGroup>
            )}
            <NativeSelectOptGroup label="Presets">
              {PERSONA_PRESETS.map((preset) => (
                <option key={preset.slug} value={preset.slug}>
                  {preset.label} — {preset.hint}
                </option>
              ))}
            </NativeSelectOptGroup>
          </NativeSelect>
        </div>

        {/* 4. Aspect Ratio & Quality Dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="aspect-select" className="text-body-sm font-semibold text-foreground">
              4. Canvas Shape
            </Label>
            <NativeSelect
              id="aspect-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-body-sm"
              disabled={busy}
            >
              <option value="1:1">Square (1:1)</option>
              <option value="3:4">Portrait (3:4)</option>
              <option value="4:3">Wide (4:3)</option>
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="quality-select" className="text-body-sm font-semibold text-foreground">
              5. Print Quality
            </Label>
            <NativeSelect
              id="quality-select"
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-body-sm"
              disabled={busy}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </NativeSelect>
          </div>
        </div>

        {/* Submit & Quota */}
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            type="submit"
            disabled={busy || tooShort}
            className="btn-ember relative flex w-full items-center justify-center gap-2.5 !rounded-full border-2 border-foreground px-6 py-3.5 text-body-sm font-semibold shadow-[2px_2px_0px_0px_#262626] transition-all hover:shadow-[3px_3px_0px_0px_#262626] disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5 text-foreground" />
            <span>
              {busy
                ? imagesPerJob === 1
                  ? "Rendering your design…"
                  : `Rendering ${imagesPerJob} designs…`
                : imagesPerJob === 1
                  ? "Generate design"
                  : `Generate ${imagesPerJob} designs`}
            </span>
          </motion.button>

          <div className="flex items-center justify-between text-caption text-muted-ink">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Up to {dailyImageCap} images per day
            </span>
            <span>Private until listed</span>
          </div>
        </div>

        {phase.step === "failed" && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-body-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{phase.message}</span>
          </div>
        )}
      </form>

      {/* Artwork Showcase & Results Column */}
      <div className="flex flex-col gap-4 lg:col-span-6">
        {slots === 0 && (
          <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-foreground/30 bg-card/60 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground bg-accent shadow-[2px_2px_0px_0px_#262626]">
              <Wand2 className="h-7 w-7 text-foreground" />
            </div>
            <div className="flex flex-col gap-1.5 max-w-sm">
              <h3 className="text-body font-semibold text-foreground">
                Artwork Showcase
              </h3>
              <p className="text-body-sm text-muted-ink leading-relaxed">
                Your 1-of-1 print renders here. Background stays on until you
                take it off — the cut is a button on your designs, not something
                that happens to your artwork automatically.
              </p>
            </div>
          </div>
        )}

        {/* One design gets the whole column; a fan-out tiles two up. */}
        {slots > 0 && (
          <div className={cn("grid gap-4", slots > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {Array.from({ length: slots }, (_, index) => {
              const design = landed[index]

              if (!design) {
                return (
                  <Skeleton
                    key={index}
                    className="aspect-[4/5] w-full rounded-2xl border-2 border-foreground/20 bg-card animate-pulse"
                  />
                )
              }

              const isPicked = picked === design.id
              return (
                <motion.button
                  key={design.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => setPicked(design.id)}
                  className={cn(
                    "group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 bg-card text-left transition-all outline-none",
                    isPicked
                      ? "border-foreground shadow-[3px_3px_0px_0px_#262626] ring-2 ring-foreground"
                      : "border-foreground/40 hover:border-foreground hover:shadow-[2px_2px_0px_0px_#262626]",
                  )}
                >
                  <Image
                    src={design.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, 45vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isPicked && (
                    <div className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-foreground bg-[#a3e635] text-foreground shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}

        {phase.step === "generating" && (
          <p className="text-body-sm text-muted-ink text-center">
            {imagesPerJob === 1
              ? "Rendering your design… this takes about a minute."
              : `Rendering ${imagesPerJob} designs… Variations appear as they finish.`}
          </p>
        )}

        {phase.step === "done" && !picked && (
          <p className="text-body-sm font-medium text-foreground text-center">
            Select your favorite artwork variant above to list it in the Bazaar.
          </p>
        )}

        {pickedDesign && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[2px_2px_0px_0px_#262626]"
          >
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Shirt className="h-5 w-5 text-foreground" />
              <h3 className="text-body-sm font-semibold text-foreground">
                List Artwork to Bazaar
              </h3>
            </div>
            <p className="text-caption text-muted-ink">
              Choose the garment, placement, and set your price to list this 1-of-1 design.
            </p>
            <ListingForm
              designId={pickedDesign.id}
              imageUrl={pickedDesign.imageUrl}
              isListed={false}
              priceCents={null}
              garmentOptions={garmentOptions}
              frozen={false}
              initialConfig={{
                garmentSlug: null,
                variantId: null,
                placement: null,
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
