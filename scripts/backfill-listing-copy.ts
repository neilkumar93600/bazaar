#!/usr/bin/env node
/**
 * Gives every design a written name and a buyer-facing description.
 *
 *   npx tsx scripts/backfill-listing-copy.ts --dry
 *   npx tsx scripts/backfill-listing-copy.ts --limit 5
 *   npx tsx scripts/backfill-listing-copy.ts
 *
 * WHY. `designs.title` was backfilled by migration 20260810160000 as the first
 * seven words of the maker's prompt, and `designs.description` has been null on
 * everything minted before the column existed. So every card, every <title> and
 * every share preview reads back the prompt — "a diver curled inside the shell
 * of" — which is exactly the recipe the product is not supposed to publish.
 *
 * This runs the same `composeListing()` the create flow already runs, over the
 * rows that never got it. Nothing new is invented here: same model, same
 * prompt, same clamps.
 *
 * SAFE TO RE-RUN. A row is only picked up while its title still looks like its
 * prompt (or is missing). Once Kimi has named it, the next run skips it, so an
 * interrupted pass is resumed by running it again.
 */
import "./load-env.ts"

import { createClient } from "@supabase/supabase-js"

import { composeListing } from "../lib/generation/compose.ts"
import {
  DEFAULT_STYLE_SLUG,
  findStyle,
  type StylePreset,
} from "../lib/generation/styles.ts"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry")
const limitIndex = args.indexOf("--limit")
const limit = limitIndex === -1 ? Infinity : Number(args[limitIndex + 1])

if (!Number.isFinite(limit) || limit <= 0) {
  // `Number(undefined)` is NaN, `slice(0, NaN)` is [], and the script would
  // otherwise report "nothing to do" and exit 0 — the worst possible answer
  // from the thing that removes prompts from public view.
  console.error("--limit needs a positive number")
  process.exit(1)
}

/** Kimi runs 26-60s a call, so 36 designs in series is half an hour. Four at a
 *  time is the whole set in about two minutes and stays well inside MuAPI's
 *  rate limit. */
const CONCURRENCY = 4

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  process.exit(1)
}

if (!process.env.MUAPI_API_KEY) {
  console.error("MUAPI_API_KEY is required — composeListing writes no title without it")
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

type Row = {
  id: string
  prompt: string | null
  title: string | null
  description: string | null
  generation_job_id: string | null
}

/** True while the "title" is still the prompt wearing a hat — null, or the
 *  leading words of the prompt, which is what the migration wrote. */
function needsCopy(row: Row): boolean {
  if (!row.description) return true
  if (!row.title) return true
  const prompt = (row.prompt ?? "").trim().toLowerCase()
  return prompt.length > 0 && prompt.startsWith(row.title.trim().toLowerCase())
}

const { data: designs, error } = await admin
  .from("designs")
  .select("id, prompt, title, description, generation_job_id")
  .order("created_at", { ascending: false })

if (error) {
  console.error("Could not read designs:", error.message)
  process.exit(1)
}

const targets = (designs as Row[]).filter(needsCopy).slice(0, limit)

if (targets.length === 0) {
  console.log("Every design already has written copy. Nothing to do.")
  process.exit(0)
}

// One query for the styles rather than one per design: the style only decides
// which aesthetic the copywriter is told about.
const jobIds = [...new Set(targets.map((d) => d.generation_job_id).filter(Boolean))]
const { data: jobs } = jobIds.length
  ? await admin.from("generation_jobs").select("id, style_slug").in("id", jobIds as string[])
  : { data: [] as { id: string; style_slug: string | null }[] }

const styleByJob = new Map((jobs ?? []).map((j) => [j.id, j.style_slug]))
const fallbackStyle = findStyle(DEFAULT_STYLE_SLUG)

if (!fallbackStyle) {
  console.error(`DEFAULT_STYLE_SLUG "${DEFAULT_STYLE_SLUG}" is not a known style`)
  process.exit(1)
}

function styleFor(row: Row): StylePreset {
  const slug = row.generation_job_id ? styleByJob.get(row.generation_job_id) : null
  return (slug ? findStyle(slug) : null) ?? fallbackStyle!
}

console.log(
  `${targets.length} design${targets.length === 1 ? "" : "s"} to name${dryRun ? " (dry run)" : ""}\n`
)

let written = 0
let skipped = 0
let cursor = 0

async function worker() {
  while (cursor < targets.length) {
    const row = targets[cursor++]
    const idea = (row.prompt ?? "").trim()

    if (!idea) {
      console.log(`- ${row.id}  skipped: no prompt to work from`)
      skipped++
      continue
    }

    const copy = await composeListing({ idea, style: styleFor(row) })

    // `composed: false` means Kimi failed, and composeListing then returns a
    // null title on purpose. Writing that would replace a bad name with no
    // name; leaving the row alone keeps it in scope for the next run.
    if (!copy.composed) {
      console.log(`- ${row.id}  skipped: composer fell back, leaving the row for a re-run`)
      skipped++
      continue
    }

    console.log(`- ${row.id}\n    title: ${copy.title}\n    desc:  ${copy.description}`)

    if (dryRun) continue

    const { error: updateError } = await admin
      .from("designs")
      .update({ title: copy.title, description: copy.description })
      .eq("id", row.id)

    if (updateError) {
      console.error(`    write failed: ${updateError.message}`)
      skipped++
      continue
    }

    written++
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker))

console.log(
  `\n${dryRun ? "Dry run — nothing written." : `${written} updated.`}${skipped ? ` ${skipped} left for a re-run.` : ""}`
)
