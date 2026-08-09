#!/usr/bin/env node
/**
 * Fills the catalogue with real generated designs. This is what replaced
 * `supabase/seed.sql` — no placeholder rows, no fake creators, no local PNGs
 * standing in for artwork. Every design it writes went through the same
 * adapter, prompt and storage bucket the live create flow uses, so what lands
 * in the database is indistinguishable from a design a visitor made.
 *
 *   node scripts/generate-designs.ts                 12 designs, spread across vibes
 *   node scripts/generate-designs.ts --count 30      more of them
 *   node scripts/generate-designs.ts --vibe riot     all into one vibe
 *   node scripts/generate-designs.ts --dry           print the plan, call nothing
 *
 * Needs MUAPI_API_KEY and the Supabase service-role key in .env.local. Costs
 * real money per image — two MuAPI calls each, generation then background
 * removal — so `--dry` first if you're unsure of the count.
 *
 * Run with plain `node` (v22.6+ strips the types).
 */
import { readFileSync } from "node:fs"

import { generate } from "../lib/generation/adapter.ts"
import { buildPrompt, MAX_PROMPT_LENGTH } from "../lib/generation/prompt.ts"
import { syncDesignProduct } from "../lib/printify/sync.ts"

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function loadEnv(): Record<string, string> {
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  return Object.fromEntries(
    file
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => [
        line.slice(0, line.indexOf("=")).trim(),
        line.slice(line.indexOf("=") + 1).trim(),
      ])
  )
}

const env = loadEnv()

// lib/printify reads its credentials off process.env, the same as it does in the
// app. Existing values win so a shell export can override the file.
for (const [key, value] of Object.entries(env)) process.env[key] ??= value

function required(key: string): string {
  const value = env[key] || process.env[key]
  if (!value) {
    console.error(`Missing ${key} in .env.local`)
    process.exit(1)
  }
  return value
}

const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_KEY = required("SUPABASE_SERVICE_ROLE_KEY")

// ---------------------------------------------------------------------------
// The idea bank
//
// Subjects only — the house art direction (medium, palette, composition, the
// no-letterforms rule) comes from buildPrompt, exactly as it does for a real
// user. These are written the way a person types into the create box: an image,
// not a specification.
// ---------------------------------------------------------------------------

const IDEAS = [
  "a moth with cathedral windows for wings, wings spread wide",
  "a diver curled inside the shell of a giant nautilus",
  "two hands passing a burning match between them",
  "a wolf made of storm clouds, head tipped back howling",
  "an astronaut tending a greenhouse of impossible flowers",
  "a lighthouse keeper carrying the light down a spiral stair",
  "a koi fish circling the rings of a planet",
  "a beekeeper whose veil is a swarm of golden bees",
  "a fox curled around a pocket watch, asleep",
  "a mountain range folded out of a paper crane",
  "a whale breaching through a field of wheat",
  "a hand reaching up through cracked desert earth, holding a seedling",
  "an owl perched on a broken compass rose",
  "a jellyfish drifting through the arches of a ruined temple",
  "a stag whose antlers branch into bare winter trees",
  "a sailor tattooing a map onto their own forearm",
  "a raven unlocking a birdcage from the outside",
  "a snake coiled through the spokes of a bicycle wheel",
  "a monk sweeping stars off a temple floor",
  "a hummingbird drinking from an hourglass",
  "a bear standing in a river of falling leaves",
  "a chess knight dissolving into a horse mid-gallop",
  "a diver's helmet overgrown with coral and anemones",
  "a crow carrying a single lit bulb across a wire",
  "a tiger stepping out of its own striped shadow",
  "a woman braiding her hair into a rope bridge",
  "a rabbit conductor leading an orchestra of crickets",
  "an octopus repairing a grandfather clock",
  "a phoenix folded from origami paper, mid-ignition",
  "a shepherd counting comets instead of sheep",
]

for (const idea of IDEAS) {
  if (idea.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Idea exceeds MAX_PROMPT_LENGTH: ${idea}`)
  }
}

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

function flag(name: string): string | undefined {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? undefined : args[index + 1]
}

const count = Number(flag("count") ?? 12)
const vibeSlug = flag("vibe")
const priceCents = Number(flag("price") ?? 2900)
const dryRun = args.includes("--dry")

if (!Number.isInteger(count) || count < 1) {
  console.error("--count must be a positive integer")
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Supabase (REST, so this script needs no dependencies)
// ---------------------------------------------------------------------------

const db = {
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  },

  async select<T>(path: string): Promise<T> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: db.headers,
    })
    if (!response.ok) throw new Error(`select ${path}: ${await response.text()}`)
    return response.json() as Promise<T>
  },

  async insert<T>(table: string, row: unknown): Promise<T> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...db.headers, Prefer: "return=representation" },
      body: JSON.stringify(row),
    })
    if (!response.ok) throw new Error(`insert ${table}: ${await response.text()}`)
    const [created] = (await response.json()) as T[]
    return created
  },

  async patch(table: string, filter: string, row: unknown): Promise<void> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: db.headers,
      body: JSON.stringify(row),
    })
    if (!response.ok) throw new Error(`patch ${table}: ${await response.text()}`)
  },

  /** Uploads to the public `designs` bucket and returns the public URL —
   *  which is also the URL Printify fetches, so it has to stay public. */
  async upload(path: string, bytes: Uint8Array): Promise<string> {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/designs/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: bytes as unknown as BodyInit,
      }
    )
    if (!response.ok) throw new Error(`upload ${path}: ${await response.text()}`)
    return `${SUPABASE_URL}/storage/v1/object/public/designs/${path}`
  },
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

type Vibe = { id: string; name: string; slug: string }
type Profile = { id: string; handle: string; display_name?: string | null }

const vibes = await db.select<Vibe[]>("vibes?select=id,name,slug&order=name")
if (vibes.length === 0) {
  console.error("No vibes exist. Insert at least one before generating.")
  process.exit(1)
}

const targets = vibeSlug ? vibes.filter((v) => v.slug === vibeSlug) : vibes
if (targets.length === 0) {
  console.error(`No vibe with slug "${vibeSlug}". Have: ${vibes.map((v) => v.slug).join(", ")}`)
  process.exit(1)
}

// Designs are attributed to a real account — this is the creator a storefront
// will credit, so it defaults to a named profile rather than whichever row
// comes back first.
const ownerHandle = flag("owner")
const profiles = await db.select<Profile[]>(
  "profiles?select=id,handle,display_name&order=display_name.asc.nullslast"
)
const owner = ownerHandle
  ? profiles.find((p) => p.handle === ownerHandle)
  : profiles[0]

if (!owner) {
  console.error(
    ownerHandle
      ? `No profile with handle "${ownerHandle}". Have: ${profiles.map((p) => p.handle).join(", ")}`
      : "No profile exists to own the generated designs."
  )
  process.exit(1)
}

console.log(`\nGenerating ${count} designs`)
console.log(`  vibes:  ${targets.map((v) => v.slug).join(", ")}`)
console.log(`  owner:  @${owner.handle}`)
console.log(`  price:  $${(priceCents / 100).toFixed(2)}`)
if (dryRun) console.log("  DRY RUN — nothing will be called or written")
console.log()

let created = 0

for (let i = 0; i < count; i++) {
  // Round-robin the vibes and walk the idea bank so a run never generates the
  // same image twice in the same vibe.
  const vibe = targets[i % targets.length]
  const idea = IDEAS[i % IDEAS.length]
  const label = `[${String(i + 1).padStart(2, "0")}/${count}] ${vibe.slug}`

  if (dryRun) {
    console.log(`${label}  ${idea}`)
    continue
  }

  try {
    const job = await db.insert<{ id: string }>("generation_jobs", {
      user_id: owner.id,
      vibe_id: vibe.id,
      quality_tier: "draft",
      status: "generating",
    })

    // The app's own adapter, not a copy of it: same MuAPI calls, same prompt,
    // same background cut, so a seeded design is byte-for-byte the kind of thing
    // the create flow produces.
    const image = await generate(buildPrompt(idea, vibe.name), [], "draft")
    const imageUrl = await db.upload(`${job.id}.png`, image.bytes)

    const design = await db.insert<{ id: string }>("designs", {
      vibe_id: vibe.id,
      generation_job_id: job.id,
      creator_id: owner.id,
      image_url: imageUrl,
      prompt: idea,
      price_cents: priceCents,
      // House stock is generated *in order to* be listed — unlike the create
      // flow, where the maker decides afterwards. Straight to live.
      listed_at: new Date().toISOString(),
      // Same call the live route makes: the model refuses policy violations at
      // source and there is no review queue.
      moderation_status: "approved",
    })

    await db.patch("generation_jobs", `id=eq.${job.id}`, {
      status: "done",
      result_design_id: design.id,
    })

    // Real garment photo for the card. No-op without Printify credentials, and
    // it never throws — the design is already written either way.
    await syncDesignProduct(design.id)

    created++
    console.log(`${label}  ok  ${design.id}`)
  } catch (error) {
    console.error(`${label}  FAILED  ${(error as Error).message}`)
  }
}

if (!dryRun) {
  console.log(`\n${created}/${count} designs created.`)
  if (created < count) console.log("Re-run to fill the gap; failures wrote nothing.")
}
