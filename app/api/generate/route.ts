import { after } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { generate } from "@/lib/generation/adapter"
import {
  buildPrompt,
  MAX_PROMPT_LENGTH,
  MIN_PROMPT_LENGTH,
} from "@/lib/generation/prompt"
import { countRecentGenerations, DAILY_CAP } from "@/lib/generation/quota"

/** Ceiling for the background work. The platform kills the invocation at its
 *  own limit regardless; this just keeps a wedged request from holding on. */
export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Sign in to generate." }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    prompt?: unknown
    vibeId?: unknown
  } | null

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
  const vibeId = typeof body?.vibeId === "string" ? body.vibeId : null

  if (prompt.length < MIN_PROMPT_LENGTH || prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json(
      {
        error: `Describe your idea in ${MIN_PROMPT_LENGTH}–${MAX_PROMPT_LENGTH} characters.`,
      },
      { status: 400 },
    )
  }

  // Resolve the vibe rather than trusting the id: it names the row we write
  // and feeds the prompt, so a bogus id must not reach either.
  const { data: vibe } = vibeId
    ? await supabase.from("vibes").select("id, name").eq("id", vibeId).maybeSingle()
    : { data: null }

  if (vibeId && !vibe) {
    return Response.json({ error: "Pick a vibe." }, { status: 400 })
  }

  const used = await countRecentGenerations(supabase, user.id)

  // Couldn't read the count — refuse rather than let an unbounded number
  // through on a database hiccup.
  if (used === null) {
    return Response.json({ error: "Could not start generation." }, { status: 500 })
  }

  if (used >= DAILY_CAP) {
    return Response.json(
      { error: `You've hit today's limit of ${DAILY_CAP} generations.` },
      { status: 429 },
    )
  }

  const { data: job, error: jobError } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      vibe_id: vibe?.id ?? null,
      quality_tier: "draft",
      status: "queued",
    })
    .select("id")
    .single()

  if (jobError || !job) {
    return Response.json({ error: "Could not start generation." }, { status: 500 })
  }

  // Hand back the id now; the client polls the row. Everything below runs
  // after the response has been sent.
  after(async () => {
    await runGeneration(job.id, prompt, vibe?.name ?? null, vibe?.id ?? null)
  })

  return Response.json({ jobId: job.id }, { status: 202 })
}

/** Service-role client. The designs bucket deliberately has no client-side
 *  insert policy, and the job/design rows are written on the user's behalf
 *  after their request has already returned. */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function runGeneration(
  jobId: string,
  userPrompt: string,
  vibeName: string | null,
  vibeId: string | null,
) {
  const admin = serviceClient()

  try {
    await admin.from("generation_jobs").update({ status: "generating" }).eq("id", jobId)

    const image = await generate(buildPrompt(userPrompt, vibeName), [], "draft")

    const path = `${jobId}.png`
    const { error: uploadError } = await admin.storage
      .from("designs")
      .upload(path, image.bytes, { contentType: image.contentType, upsert: true })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    const {
      data: { publicUrl },
    } = admin.storage.from("designs").getPublicUrl(path)

    const { data: design, error: designError } = await admin
      .from("designs")
      .insert({
        vibe_id: vibeId,
        generation_job_id: jobId,
        image_url: publicUrl,
        prompt: userPrompt,
        // Auto-approved by design decision — the model refuses policy
        // violations at source and there is no review queue. See the spec.
        moderation_status: "approved",
      })
      .select("id")
      .single()

    if (designError || !design) {
      throw new Error(`Design insert failed: ${designError?.message}`)
    }

    await admin
      .from("generation_jobs")
      .update({ status: "done", result_design_id: design.id })
      .eq("id", jobId)
  } catch (error) {
    console.error(`[generate] job ${jobId} failed:`, error)
    await admin.from("generation_jobs").update({ status: "failed" }).eq("id", jobId)
  }
}
