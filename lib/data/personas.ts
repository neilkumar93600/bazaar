import type { SupabaseClient } from "@supabase/supabase-js"

export type UserPersona = {
  id: string
  name: string
  styleSummary: string
  referenceImageUrls: string[]
  createdAt: string
}

/** A maker's own saved personas, newest first. RLS already scopes this to
 *  the caller — `owner_id` is never passed in, so there is nothing for a
 *  stray filter bug here to leak. */
export async function getUserPersonas(
  supabase: SupabaseClient,
): Promise<UserPersona[]> {
  const { data } = await supabase
    .from("personas")
    .select("id, name, style_summary, reference_image_urls, created_at")
    .order("created_at", { ascending: false })

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    styleSummary: row.style_summary,
    referenceImageUrls: row.reference_image_urls,
    createdAt: row.created_at,
  }))
}
