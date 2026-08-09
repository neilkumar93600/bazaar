"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from "@/lib/generation/prompt"
import { clearHeroDraft, readHeroDraft } from "@/lib/hero-draft"
import { ListingForm } from "@/components/dashboard/ListingForm"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

export type CreateVibe = { id: string; name: string }

const POLL_INTERVAL_MS = 2000
/** Give up rather than spin forever. The platform can kill the background work
 *  mid-flight, which leaves the row on `generating` with nothing coming. */
const POLL_CEILING_MS = 180_000

type Phase =
  | { step: "idle" }
  | { step: "generating" }
  | { step: "done"; designId: string; imageUrl: string }
  | { step: "failed"; message: string }

export function CreateForm({
  vibes,
  initialPrompt = null,
  initialVibeId = null,
}: {
  vibes: CreateVibe[]
  /** From `?prompt=` — the home hero's handoff for a signed-in visitor. */
  initialPrompt?: string | null
  /** From `?vibe=`. Ignored unless it names a vibe this user was actually
   *  offered, so a stale or edited id can't preselect nothing. */
  initialVibeId?: string | null
}) {
  const [prompt, setPrompt] = useState(
    () => initialPrompt?.slice(0, MAX_PROMPT_LENGTH) ?? "",
  )
  const [vibeId, setVibeId] = useState(() =>
    initialVibeId && vibes.some((vibe) => vibe.id === initialVibeId)
      ? initialVibeId
      : (vibes[0]?.id ?? ""),
  )
  const [phase, setPhase] = useState<Phase>({ step: "idle" })

  // A signed-out visitor who submitted the hero form was bounced through
  // /login, which dropped the query string. The draft rode along in
  // sessionStorage instead; pick it up once, then clear it so a later visit to
  // this page starts empty. Skipped entirely when the URL already carried a
  // prompt.
  // Mount-only, and it has to be an effect: sessionStorage doesn't exist during
  // the server render, so seeding this in `useState` would make the server and
  // the first client pass disagree — a hydration mismatch instead of a prefill.
  // Reading it after mount and setting state is the supported shape for
  // browser-only storage, hence the disables below.
  useEffect(() => {
    // Cleared even when the URL already carried the draft — otherwise the
    // stash outlives the handoff and a later visit here restores a stale
    // prompt over an empty form.
    const draft = readHeroDraft()
    clearHeroDraft()
    if (initialPrompt || !draft) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrompt(draft.prompt.slice(0, MAX_PROMPT_LENGTH))
    if (draft.vibeId && vibes.some((vibe) => vibe.id === draft.vibeId)) {
      setVibeId(draft.vibeId)
    }
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
          message: "This is taking longer than expected. Check your designs in a moment.",
        })
        return
      }

      const { data } = await supabase
        .from("generation_jobs")
        .select("status, result_design_id")
        .eq("id", jobId)
        .maybeSingle()

      if (data?.status === "failed") {
        setPhase({ step: "failed", message: "Generation failed. Try a different idea." })
        return
      }

      if (data?.status === "done" && data.result_design_id) {
        const { data: design } = await supabase
          .from("designs")
          .select("id, image_url")
          .eq("id", data.result_design_id)
          .maybeSingle()

        if (design) {
          setPhase({ step: "done", designId: design.id, imageUrl: design.image_url })
          return
        }
      }

      timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
    }

    timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPhase({ step: "generating" })

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, vibeId: vibeId || null }),
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

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-5 lg:max-w-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="prompt">Your idea</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
            placeholder="A hooded elder weighing two planets on a golden scale"
            rows={3}
            disabled={busy}
          />
          <p className="text-caption text-muted-foreground">
            {prompt.trim().length}/{MAX_PROMPT_LENGTH} · we handle the art direction
          </p>
        </div>

        {vibes.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="vibe">Vibe</Label>
            <NativeSelect
              id="vibe"
              className="w-full"
              value={vibeId}
              onChange={(e) => setVibeId(e.target.value)}
              disabled={busy}
            >
              {vibes.map((vibe) => (
                <option key={vibe.id} value={vibe.id}>
                  {vibe.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        <Button type="submit" disabled={busy || tooShort} className="btn-ember w-fit rounded-full">
          {busy ? "Generating…" : "Generate design"}
        </Button>

        {phase.step === "failed" && (
          <p className="text-body-sm text-destructive">{phase.message}</p>
        )}

        <p className="text-caption text-muted-foreground">
          Designs are private to you until you list them. Once someone claims
          one, it&apos;s theirs — you can&apos;t relist or resell it.
        </p>
      </form>

      <div className="w-full lg:max-w-sm">
        {phase.step === "generating" && (
          <div className="flex flex-col gap-3">
            <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
            <p className="text-body-sm text-muted-foreground">
              Drawing your 1-of-1. This takes up to a minute.
            </p>
          </div>
        )}

        {phase.step === "done" && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={phase.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 384px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="text-body-sm text-muted-foreground">
              Yours, and private. List it to put it in the bazaar — or leave it
              and decide later from your designs.
            </p>
            <ListingForm designId={phase.designId} isListed={false} priceCents={null} />
            <Button
              variant="outline"
              render={<Link href="/dashboard/designs" />}
              className="w-fit rounded-full"
            >
              My designs <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
