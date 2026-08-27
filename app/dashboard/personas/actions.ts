"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { analyzePersonaStyle } from "@/lib/generation/persona-analysis"

export type PersonaState = { error?: string; success?: boolean }

const MIN_REFERENCE_IMAGES = 10
const MAX_REFERENCE_IMAGES = 50
const MAX_NAME_CHARS = 60

/** Has a vision model derive the shared style from an already-uploaded
 *  reference set, and saves the persona. The images themselves go straight
 *  from the browser to Storage under the caller's own session before this
 *  runs (see PersonaManager's handleSubmit) — a Server Action body is capped
 *  by Vercel's serverless payload limit (hard 4.5MB, unrelated to
 *  next.config's bodySizeLimit), which 10-50 full-resolution images blow
 *  past immediately. This action only ever sees the resulting URLs, small
 *  enough that body size is a non-issue, and re-checks each one is actually
 *  this user's own upload before trusting it.
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

  const imageUrls = formData
    .getAll("imageUrls")
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)

  if (imageUrls.length < MIN_REFERENCE_IMAGES) {
    return {
      error: `Upload at least ${MIN_REFERENCE_IMAGES} reference designs — ${imageUrls.length} isn't enough for the style to come through.`,
    }
  }
  if (imageUrls.length > MAX_REFERENCE_IMAGES) {
    return { error: `Keep it to ${MAX_REFERENCE_IMAGES} reference designs or fewer.` }
  }

  // Ownership check: the client picked these paths itself, so confirm every
  // URL actually points at this user's own persona-refs prefix rather than
  // trusting whatever the form posted.
  const ownPrefix = `/designs/persona-refs/${user.id}/`
  if (imageUrls.some((url) => !url.includes(ownPrefix))) {
    return { error: "Those images weren't uploaded by you. Try again." }
  }

  let styleSummary: string
  try {
    styleSummary = await analyzePersonaStyle(imageUrls)
  } catch (error) {
    console.error(`[personas] style analysis failed for user ${user.id}`, error)
    return { error: "Couldn't work out a style from those images. Try again in a moment." }
  }

  const { error: insertError } = await supabase.from("personas").insert({
    owner_id: user.id,
    name,
    style_summary: styleSummary,
    reference_image_urls: imageUrls,
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
