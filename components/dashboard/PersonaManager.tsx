"use client"

import { useActionState, useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Palette, Upload, Trash2, Sparkles, AlertCircle } from "lucide-react"

import { createPersona, deletePersona, type PersonaState } from "@/app/dashboard/personas/actions"
import type { UserPersona } from "@/lib/data/personas"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const MIN_IMAGES = 20
const MAX_IMAGES = 50

const initialState: PersonaState = {}

export function PersonaManager({ personas }: { personas: UserPersona[] }) {
  return (
    <div className="flex flex-col gap-8">
      <PersonaCreateForm />
      {personas.length > 0 && <PersonaList personas={personas} />}
    </div>
  )
}

function PersonaCreateForm() {
  const [state, formAction, isPending] = useActionState(createPersona, initialState)
  const [files, setFiles] = useState<File[]>([])

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    setFiles(Array.from(list).slice(0, MAX_IMAGES))
  }

  // Recomputed only when the selection changes, and revoked on the way out —
  // createObjectURL on every render would leak one blob per thumbnail per
  // render.
  const previewUrls = useMemo(
    () => files.slice(0, 20).map((file) => URL.createObjectURL(file)),
    [files],
  )
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border-2 border-foreground bg-card p-6 md:p-8 shadow-[2px_2px_0px_0px_#262626]"
    >
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Palette className="h-5 w-5 text-foreground" />
        <h2 className="text-body-sm font-semibold text-foreground">
          Create a Persona
        </h2>
      </div>

      <p className="text-body-sm text-muted-ink">
        Upload {MIN_IMAGES}–{MAX_IMAGES} designs whose style you want to keep
        making. A vision model looks at all of them together and writes a
        style profile — recurring linework, palette, motifs, mood. Pick this
        persona later in the create form and every new design leans toward it.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="persona-name" className="text-body-sm font-semibold text-foreground">
          Persona name
        </Label>
        <Input
          id="persona-name"
          name="name"
          placeholder="e.g. Late-night streetwear"
          maxLength={60}
          disabled={isPending}
          required
          className="rounded-xl border-2 border-border bg-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="persona-images" className="text-body-sm font-semibold text-foreground">
          Reference designs
        </Label>
        <label
          htmlFor="persona-images"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/60 px-4 py-8 text-center transition-colors hover:border-foreground"
        >
          <Upload className="h-6 w-6 text-muted-ink" />
          <span className="text-body-sm font-medium text-foreground">
            {files.length > 0
              ? `${files.length} image${files.length === 1 ? "" : "s"} selected`
              : "Click to choose images"}
          </span>
          <span className="text-caption text-muted-ink">
            {MIN_IMAGES}–{MAX_IMAGES} images, PNG or JPG
          </span>
        </label>
        <input
          id="persona-images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          disabled={isPending}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {files.length > 0 && (
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {previewUrls.map((url) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-background"
              >
                {/* Object URLs, not next/image: these never leave the browser
                    and are revoked the moment the selection changes. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
            {files.length > 20 && (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-background text-caption font-medium text-muted-ink">
                +{files.length - 20}
              </div>
            )}
          </div>
        )}
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-body-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <p className="text-body-sm font-medium text-emerald-700">
          Persona saved — pick it in the create form.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || files.length < MIN_IMAGES}
        className="btn-ember flex w-full items-center justify-center gap-2.5 !rounded-full border-2 border-foreground px-6 py-3.5 text-body-sm font-semibold shadow-[2px_2px_0px_0px_#262626] transition-all hover:shadow-[3px_3px_0px_0px_#262626] disabled:opacity-50"
      >
        <Sparkles className="h-5 w-5 text-foreground" />
        {isPending ? "Analyzing your style…" : "Create persona"}
      </button>
    </form>
  )
}

function PersonaList({ personas }: { personas: UserPersona[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-body-sm font-semibold text-foreground">Your personas</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence>
          {personas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PersonaCard({ persona }: { persona: UserPersona }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-card p-5 shadow-[2px_2px_0px_0px_#262626]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-body font-semibold text-foreground">{persona.name}</h3>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await deletePersona(persona.id)
              if (result.error) setError(result.error)
            })
          }}
          className="shrink-0 rounded-lg p-1.5 text-muted-ink transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label={`Delete ${persona.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {persona.referenceImageUrls.slice(0, 6).map((url, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border">
            <Image src={url} alt="" fill sizes="60px" className="object-cover" />
          </div>
        ))}
      </div>

      <p className="text-body-sm text-muted-ink">{persona.styleSummary}</p>
      <p className="text-caption text-muted-ink">
        {persona.referenceImageUrls.length} reference designs
      </p>

      {error && <p className="text-caption font-medium text-destructive">{error}</p>}
    </motion.div>
  )
}
