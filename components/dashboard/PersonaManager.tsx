"use client"

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Palette, Upload, Trash2, Sparkles, AlertCircle } from "lucide-react"

import { createPersona, deletePersona, type PersonaState } from "@/app/dashboard/personas/actions"
import { createClient } from "@/lib/supabase/client"
import type { UserPersona } from "@/lib/data/personas"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const MIN_IMAGES = 10
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
  const [uploading, setUploading] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // A file input replaces its whole FileList on every pick — merge old and
  // new picks into React state instead, so a second pick adds to the
  // selection rather than replacing it.
  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}:${f.lastModified}`))
      const merged = [...prev]
      for (const file of Array.from(list)) {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        if (seen.has(key) || merged.length >= MAX_IMAGES) continue
        seen.add(key)
        merged.push(file)
      }
      return merged
    })
  }

  const clearFiles = () => {
    if (inputRef.current) inputRef.current.value = ""
    setFiles([])
    setUploadError(null)
  }

  // Same input element sticks around after a save, so drop the old selection
  // rather than let it be submitted a second time.
  useEffect(() => {
    if (state.success) clearFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success])

  // Images go straight from the browser to Storage under the caller's own
  // session (RLS scoped to persona-refs/{uid}/*) — a Server Action body is
  // capped by Vercel's serverless payload limit (hard 4.5MB) which 10-50
  // full-resolution images blow past immediately. The action itself only
  // ever receives the resulting URLs.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploadError(null)
    if (files.length < MIN_IMAGES) return

    const name = new FormData(e.currentTarget).get("name")

    setUploading(true)
    setUploadedCount(0)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setUploadError("Sign in to create a persona.")
        return
      }

      const urls: string[] = []
      for (const [index, file] of files.entries()) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const path = `persona-refs/${user.id}/${Date.now()}-${index}.${ext}`

        const { error } = await supabase.storage
          .from("designs")
          .upload(path, file, { contentType: file.type || "image/jpeg" })
        if (error) {
          setUploadError(`Couldn't upload reference ${index + 1}. Try again.`)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("designs").getPublicUrl(path)
        urls.push(publicUrl)
        setUploadedCount(index + 1)
      }

      const fd = new FormData()
      fd.set("name", String(name ?? ""))
      urls.forEach((url) => fd.append("imageUrls", url))
      formAction(fd)
    } finally {
      setUploading(false)
    }
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
      onSubmit={handleSubmit}
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
          disabled={isPending || uploading}
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
              ? `${files.length} image${files.length === 1 ? "" : "s"} selected — click to add more`
              : "Click to choose images"}
          </span>
          <span className="text-caption text-muted-ink">
            {MIN_IMAGES}–{MAX_IMAGES} images, PNG or JPG
          </span>
        </label>
        <input
          ref={inputRef}
          id="persona-images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          disabled={isPending || uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {files.length > 0 && (
          <button
            type="button"
            onClick={clearFiles}
            disabled={isPending || uploading}
            className="self-start text-caption font-medium text-muted-ink underline underline-offset-2 hover:text-foreground disabled:opacity-50"
          >
            Clear selection
          </button>
        )}

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

      {(uploadError || state.error) && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-body-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError || state.error}</span>
        </div>
      )}

      {state.success && (
        <p className="text-body-sm font-medium text-emerald-700">
          Persona saved — pick it in the create form.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isPending || uploading || files.length < MIN_IMAGES}
          className="btn-ember flex w-full items-center justify-center gap-2.5 !rounded-full border-2 border-foreground px-6 py-3.5 text-body-sm font-semibold shadow-[2px_2px_0px_0px_#262626] transition-all hover:shadow-[3px_3px_0px_0px_#262626] disabled:opacity-50"
        >
          {uploading || isPending ? (
            <Spinner className="h-5 w-5 text-foreground" />
          ) : (
            <Sparkles className="h-5 w-5 text-foreground" />
          )}
          {uploading
            ? `Uploading images… ${uploadedCount}/${files.length}`
            : isPending
              ? "Analyzing your style…"
              : "Create persona"}
        </button>

        <AnimatePresence>
          {(uploading || isPending) && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="h-1.5 w-full overflow-hidden rounded-full bg-border"
            >
              {uploading ? (
                <motion.div
                  className="h-full rounded-full bg-foreground"
                  animate={{ width: `${(uploadedCount / Math.max(files.length, 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <motion.div
                  className="h-full w-1/3 rounded-full bg-foreground"
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
