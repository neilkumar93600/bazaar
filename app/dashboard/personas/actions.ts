"use server"

import { revalidatePath } from "next/cache"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { analyzePersonaStyle } from "@/lib/generation/persona-analysis"

export type PersonaState = { error?: string; success?: boolean }

const MIN_REFERENCE_IMAGES = 10
const MAX_REFERENCE_IMAGES = 50
const MAX_NAME_CHARS = 60

/** Uploads the reference set, has a vision model derive the shared style,
 *  and saves the persona. All server-side: the upload alone could go through
 *  the caller's own session (storage RLS would allow it under their own
 *  path), but the analysis call needs MUAPI_API_KEY, so the whole thing runs
 *  here rather than splitting the flow across a client upload and a second
 *  server call.
 *
 *  Throws nothing back to the client as an unhandled rejection — a maker
 *  waiting on this button press needs a reason, not a blank failure, so every
 *  exit is a returned `{ error }`. */
export async function createPersona(
  _prevState: PersonaState,
  formData: FormData,
): Promise<PersonaState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sign in to create a persona." }

  const name = String(formData.get("name") ?? "").trim().slice(0, MAX_NAME_CHARS)
  if (!name) return { error: "Give this persona a name." }

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (files.length < MIN_REFERENCE_IMAGES) {
    return {
      error: `Upload at least ${MIN_REFERENCE_IMAGES} reference designs — ${files.length} isn't enough for the style to come through.`,
    }
  }
  if (files.length > MAX_REFERENCE_IMAGES) {
    return { error: `Keep it to ${MAX_REFERENCE_IMAGES} reference designs or fewer.` }
  }

  const admin = createServiceClient()
  const uploadedUrls: string[] = []

  for (const [index, file] of files.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `persona-refs/${user.id}/${Date.now()}-${index}.${ext}`

    const { error: uploadError } = await admin.storage
      .from("designs")
      .upload(path, file, { contentType: file.type || "image/jpeg" })

    if (uploadError) {
      return { error: `Couldn't upload reference ${index + 1}. Try again.` }
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("designs").getPublicUrl(path)
    uploadedUrls.push(publicUrl)
  }

  let styleSummary: string
  try {
    styleSummary = await analyzePersonaStyle(uploadedUrls)
  } catch (error) {
    console.error(`[personas] style analysis failed for user ${user.id}`, error)
    return { error: "Couldn't work out a style from those images. Try again in a moment." }
  }

  const { error: insertError } = await admin.from("personas").insert({
    owner_id: user.id,
    name,
    style_summary: styleSummary,
    reference_image_urls: uploadedUrls,
  })

  if (insertError) {
    console.error(`[personas] insert failed for user ${user.id}`, insertError)
    return { error: "Couldn't save the persona. Try again." }
  }

  revalidatePath("/dashboard/personas")
  revalidatePath("/create")
  return { success: true }
}

/** Reference images are left in storage rather than swept on delete — the
 *  "designs" bucket already carries orphaned objects from other flows, and a
 *  cleanup pass belongs there, not duplicated per feature. ponytail: add a
 *  storage sweep job if orphaned reference images start to matter for cost. */
export async function deletePersona(personaId: string): Promise<PersonaState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sign in first." }

  // RLS also scopes this to the owner; the explicit .eq is what makes "you
  // don't own this" fail closed as zero rows deleted rather than relying on
  // the policy alone to notice.
  const { error } = await supabase
    .from("personas")
    .delete()
    .eq("id", personaId)
    .eq("owner_id", user.id)

  if (error) return { error: "Couldn't delete that persona." }

  revalidatePath("/dashboard/personas")
  revalidatePath("/create")
  return { success: true }
}
