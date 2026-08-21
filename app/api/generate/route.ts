import { after } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import {
  generate,
  ASPECT_RATIOS,
  QUALITIES,
  type AspectRatio,
  type Quality,
} from "@/lib/generation/adapter"
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from "@/lib/generation/prompt"
import { composeListing, composePrompt } from "@/lib/generation/compose"
import { DEFAULT_PERSONA_SLUG, findPersona } from "@/lib/generation/personas"
import {
  findStyle,
  validateStyleText,
  validateQuote,
  type StylePreset,
} from "@/lib/generation/styles"
import {
  countRecentGenerations,
  DAILY_CAP,
  IMAGES_PER_JOB,
} from "@/lib/generation/quota"

/** Ceiling for the background work. The platform kills the invocation at its
 *  own limit regardless; this just keeps a wedged request from holding on.
 *
 *  Four images run in parallel and each is two sequential model runs with a
 *  120s poll timeout apiece, so the worst case is ~240s. Inside this, but not
 *  by much — see the plan's risks. */
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
    styleSlug?: unknown
    text?: unknown
    quote?: unknown
    aspectRatio?: unknown
    quality?: unknown
    persona?: unknown
  } | null

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""

  if (prompt.length < MIN_PROMPT_LENGTH || prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json(
      {
        error: `Describe your idea in ${MIN_PROMPT_LENGTH}–${MAX_PROMPT_LENGTH} characters.`,
      },
      { status: 400 },
    )
  }

  const style =
    typeof body?.styleSlug === "string" ? findStyle(body.styleSlug) : null

  if (!style) {
    return Response.json({ error: "Pick a style." }, { status: 400 })
  }

  // Enforced server-side even though the form gates it: the client is a
  // convenience, this is the boundary.
  const textResult = validateStyleText(
    style,
    typeof body?.text === "string" ? body.text : "",
  )

  if (!textResult.ok) {
    return Response.json({ error: textResult.error }, { status: 400 })
  }

  // Only `illustrated` styles carry a second line; every other family is told
  // so rather than having it silently dropped.
  const quoteResult = validateQuote(
    style,
    typeof body?.quote === "string" ? body.quote : "",
  )

  if (!quoteResult.ok) {
    return Response.json({ error: quoteResult.error }, { status: 400 })
  }

  // Unknown values fall back rather than 400: an out-of-range aspect or quality
  // is a stale client, not an attack, and the defaults are always safe.
  const aspectRatio = ASPECT_RATIOS.includes(body?.aspectRatio as AspectRatio)
    ? (body!.aspectRatio as AspectRatio)
    : "3:4"
  const quality = QUALITIES.includes(body?.quality as Quality)
    ? (body!.quality as Quality)
    : "medium"

  // Unknown or missing slug falls back to no persona rather than 400 — same
  // "stale client, not an attack" reasoning as aspect ratio and quality above.
  const personaSlug =
    typeof body?.persona === "string" ? body.persona : DEFAULT_PERSONA_SLUG
  const personaVoice = findPersona(personaSlug)?.voice ?? null

  // The style decides the column — the form asks one question, not two.
  //
  // A style naming a vibe that doesn't exist means the presets and the database
  // disagree. That is a deployment bug, not a user error, so it is a 500 rather
  // than a silently unfiled design nobody can find in the feed.
  const { data: vibe } = await supabase
    .from("vibes")
    .select("id")
    .eq("slug", style.vibeSlug)
    .maybeSingle()

  if (!vibe) {
    console.error(
      `[generate] style ${style.slug} names unknown vibe ${style.vibeSlug}`,
    )
    return Response.json({ error: "Could not start generation." }, { status: 500 })
  }

  const used = await countRecentGenerations(supabase, user.id)

  // Couldn't read the count — refuse rather than let an unbounded number
  // through on a database hiccup.
  if (used === null) {
    return Response.json({ error: "Could not start generation." }, { status: 500 })
  }

  if (used >= DAILY_CAP) {
    return Response.json(
      { error: `You've hit today's limit of ${DAILY_CAP * IMAGES_PER_JOB} images.` },
      { status: 429 },
    )
  }

  const { data: job, error: jobError } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      vibe_id: vibe.id,
      style_slug: style.slug,
      text_content: textResult.text,
      quote_content: quoteResult.text,
      quality_tier: quality,
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
    await runGeneration(
      job.id,
      user.id,
      prompt,
      style,
      textResult.text,
      quoteResult.text,
      vibe.id,
      aspectRatio,
      quality,
      personaVoice,
    )
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
  userId: string,
  idea: string,
  style: StylePreset,
  text: string | null,
  quote: string | null,
  vibeId: string,
  aspectRatio: AspectRatio,
  quality: Quality,
  personaVoice: string | null,
) {
  const admin = serviceClient()

  await admin.from("generation_jobs").update({ status: "generating" }).eq("id", jobId)

  // One composer pass for the whole job, not one per image: the four images
  // are variations of a single design, so they share its name, description and
  // prompt. Two independent calls, not one — listing copy and the image prompt
  // have different audiences and either can fall back to its template on its
  // own, so this never throws.
  const [{ title, description }, { prompt }] = await Promise.all([
    composeListing({ idea, style }),
    composePrompt({ idea, style, text, quote, aspectRatio, persona: personaVoice }),
  ])

  // Four model runs, not one call for four images: MuAPI's endpoint has no `n`
  // parameter. In parallel because each image is two sequential model runs
  // (generate, then cut) and four of those in series would breach maxDuration.
  const settled = await Promise.allSettled(
    Array.from({ length: IMAGES_PER_JOB }, (_, index) =>
      generateOne(
        admin,
        jobId,
        userId,
        idea,
        vibeId,
        prompt,
        title,
        description,
        style,
        aspectRatio,
        quality,
        index,
      ),
    ),
  )

  const designIds: string[] = []
  for (const result of settled) {
    if (result.status === "fulfilled") designIds.push(result.value)
    else console.error(`[generate] job ${jobId} image failed:`, result.reason)
  }

  // Three good images is a good result. The job only fails when nothing landed,
  // so one timed-out run never throws away the three that worked.
  if (designIds.length === 0) {
    await admin.from("generation_jobs").update({ status: "failed" }).eq("id", jobId)
    return
  }

  await admin
    .from("generation_jobs")
    .update({ status: "done", result_design_id: designIds[0] })
    .eq("id", jobId)
}

/** One image, start to finish. Returns the design id, throws on any failure —
 *  the caller settles it.
 *
 *  The row is inserted here rather than after the fan-out so the grid fills
 *  incrementally: the client's poll sees each design the moment it lands. */
async function generateOne(
  admin: ReturnType<typeof serviceClient>,
  jobId: string,
  userId: string,
  idea: string,
  vibeId: string,
  prompt: string,
  title: string,
  description: string,
  style: StylePreset,
  aspectRatio: AspectRatio,
  quality: Quality,
  index: number,
): Promise<string> {
  // Aspect ratio and quality come straight from the create form; the prompt
  // comes from the composer. Nothing is cut here — the maker removes the
  // background afterwards if they want it removed at all.
  const image = await generate({
    prompt,
    references: [],
    aspectRatio,
    quality,
  })

  // Indexed: four images share one job, and `upsert: true` would silently
  // overwrite them into a single object otherwise.
  const path = `${jobId}-${index}.png`
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
      creator_id: userId,
      image_url: publicUrl,
      prompt: idea,
      title,
      description,
      // Private until the maker lists it. Generation is not publication —
      // see docs/superpowers/specs/2026-08-09-design-ownership-listing-design.md
      listed_at: null,
      price_cents: null,
      // Auto-approved by design decision — the model refuses policy
      // violations at source and there is no review queue.
      moderation_status: "approved",
    })
    .select("id")
    .single()

  if (designError || !design) {
    throw new Error(`Design insert failed: ${designError?.message}`)
  }

  return design.id
}
