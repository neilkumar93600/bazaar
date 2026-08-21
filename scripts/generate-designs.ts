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
 *   node scripts/generate-designs.ts --from 8        start at the 8th plan entry
 *
 * Needs MUAPI_API_KEY and the Supabase service-role key in .env.local. Costs
 * real money per image — two MuAPI calls each, generation then background
 * removal — so `--dry` first if you're unsure of the count.
 *
 * Run with plain `node` (v22.6+ strips the types).
 */
import { readFileSync } from "node:fs"

import { generate, removeBackground } from "../lib/generation/adapter.ts"
import { buildPrompt, MAX_PROMPT_LENGTH } from "../lib/generation/prompt.ts"
import { findStyle, requiredColourFor } from "../lib/generation/styles.ts"
import {
  coloursFrom,
  defaultGarment,
  sellableVariants,
} from "../lib/printify/garments.ts"
import { catalogVariants } from "../lib/printify/products.ts"
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


// ---------------------------------------------------------------------------
// The house plan
//
// Curated, not random. House stock is the shop window, so every entry names its
// own style, garment colour and print placement — the earlier round-robin put
// every design on a white tee with a front print, which is exactly what a
// storefront should not look like.
//
// `title` and `quote` are only for `illustrated` styles: those are broadsides
// (arched title, hero illustration, line underneath) and both strings are
// pinned verbatim in the prompt.
// ---------------------------------------------------------------------------

type Concept = {
  idea: string
  style: string
  colour: string
  placement: "front" | "back" | "both"
  title?: string
  quote?: string
}

const PLAN: Concept[] = [
  // Broadsides — the Prometheus/Janus shape.
  {
    style: "mythic-broadside",
    colour: "Black",
    placement: "back",
    title: "PROMETHEUS",
    quote: "THEY CHAINED THE BODY THE FIRE SPREAD",
    idea: "a chained titan wrenching one arm free, an open palm holding fire, a rayed halo behind him",
  },
  {
    style: "mythic-broadside",
    colour: "Black",
    placement: "back",
    title: "ICARUS",
    quote: "HE WAS WARNED HE WENT ANYWAY",
    idea: "a winged figure ascending into a blinding sun, feathers loosening and falling away",
  },
  {
    style: "mythic-broadside",
    colour: "Black",
    placement: "both",
    title: "ATLAS",
    quote: "NOBODY ASKED IF IT WAS HEAVY",
    idea: "a kneeling giant with a star-map sphere balanced across his shoulders",
  },
  {
    style: "occult-almanac",
    colour: "White",
    placement: "back",
    title: "THE HOURS",
    quote: "EVERY CLOCK IS A SLOW ALARM",
    idea: "an alchemical emblem of a moth on an hourglass, ringed by zodiac marginalia",
  },
  {
    style: "occult-almanac",
    colour: "White",
    placement: "front",
    title: "ROOTWORK",
    quote: "WHAT GROWS DOWN HOLDS UP",
    idea: "a tree whose roots form a human ribcage, drawn as a botanical plate",
  },

  // Anime posters.
  {
    style: "anime-poster",
    colour: "Black",
    placement: "back",
    title: "RONIN",
    quote: "NO MASTER NO MAP",
    idea: "a lone swordswoman in a torn coat, wind tearing at her, city lights behind",
  },
  {
    style: "anime-poster",
    colour: "Black",
    placement: "front",
    title: "SUNBREAK",
    quote: "MORNING FINDS EVERYBODY",
    idea: "a girl on a rooftop at dawn holding a paper lantern, hair lifting in the wind",
  },


  // --- Anime: villains and heroes, each with its own line ------------------
  // Original characters by design. These become real Printify products for
  // sale, and a recognisable franchise character on merchandise is trademark
  // infringement — so the prompts describe archetypes, never named properties.
  {
    style: "anime-villain",
    colour: "Black",
    placement: "back",
    title: "THE HOLLOW KING",
    quote: "MERCY WAS THE FIRST THING I BURIED",
    idea: "a masked antagonist in a high collar, crown of broken blades, embers drifting past a half-lit face",
  },
  {
    style: "anime-villain",
    colour: "Black",
    placement: "back",
    title: "SILENCE",
    quote: "YOU TALK THE WAY THE STRONG DO",
    idea: "a cloaked swordsman lowering a chipped katana, one eye burning through the shadow across his face",
  },
  {
    style: "anime-villain",
    colour: "Black",
    placement: "both",
    title: "THE NINTH",
    quote: "COUNT AGAIN I AM STILL HERE",
    idea: "a nine-tailed beast silhouette rising behind a small calm figure, tails curling like smoke",
  },
  {
    style: "anime-villain",
    colour: "Black",
    placement: "front",
    title: "ASHFALL",
    quote: "I ONLY BURN WHAT ASKED TO BE WARM",
    idea: "a figure walking away from a burning treeline, coat streaming, not looking back",
  },
  {
    style: "anime-poster",
    colour: "Black",
    placement: "back",
    title: "LAST TRAIN",
    quote: "I MISSED IT ON PURPOSE",
    idea: "a student on an empty midnight platform, headphones on, rain lit by the departures board",
  },
  {
    style: "anime-poster",
    colour: "Black",
    placement: "back",
    title: "STORMCALLER",
    quote: "THE SKY OWES ME NOTHING",
    idea: "a girl standing on a rooftop with both arms raised into a breaking thunderhead, hair whipping",
  },


  // --- Anime archetypes ----------------------------------------------------
  // The roles that carry an anime merch store — the sealed prodigy, the ancient
  // devouring god, the commander of the dead — written as archetypes rather
  // than as any named character. These become real Printify products for sale,
  // so a recognisable licensed character here would be commercial infringement
  // and would be pulled by Printify regardless.
  {
    style: "anime-villain",
    colour: "Black",
    placement: "back",
    title: "THE BLINDFOLD",
    quote: "I COVERED THEM SO YOU COULD LOOK",
    idea: "a tall sorcerer with a cloth bound over his eyes, hands in pockets, unbothered, light bending around him",
  },
  {
    style: "anime-villain",
    colour: "Black",
    placement: "back",
    title: "OLD APPETITE",
    quote: "I WAS WORSHIPPED BEFORE I WAS FEARED",
    idea: "an ancient devouring god with painted ritual markings and too many arms, grinning in the dark",
  },
  {
    style: "anime-villain",
    colour: "Black",
    placement: "back",
    title: "THE LAST GATE",
    quote: "EVERYTHING I KILLED STILL WALKS",
    idea: "a lone hunter in a dark coat with an army of shadow silhouettes kneeling in ranks behind him",
  },
  {
    style: "anime-villain",
    colour: "Black",
    placement: "both",
    title: "DOMAIN",
    quote: "STEP INSIDE AND THE RULES ARE MINE",
    idea: "a figure standing at the centre of an expanding sphere of warped space, hands forming a seal",
  },
  {
    style: "anime-poster",
    colour: "Black",
    placement: "back",
    title: "RANK E",
    quote: "CHECK THE BOARD AGAIN TOMORROW",
    idea: "a scrawny hunter gripping a chipped dagger at the mouth of a glowing dungeon gate, refusing to leave",
  },
  {
    style: "anime-poster",
    colour: "Black",
    placement: "front",
    title: "SIX SEALS",
    quote: "THEY BOUND ME FOR A REASON",
    idea: "a young monk wrapped in talisman paper seals, one eye glowing through a gap in the wrappings",
  },

  // Varsity lockups — the tee3 shape.
  {
    style: "varsity-lockup",
    colour: "Black",
    placement: "front",
    title: "MENTAL TOUGHNESS",
    quote: "CLUB EST TODAY",
    idea: "a collegiate athletic crest, star and rule beneath the wordmark",
  },
  {
    style: "varsity-lockup",
    colour: "Black",
    placement: "front",
    title: "NIGHT SHIFT",
    quote: "ATHLETIC DEPT NO REST",
    idea: "a collegiate department lockup with a crescent moon in place of the star",
  },

  // Typographic.
  {
    style: "slab-statement",
    colour: "Black",
    placement: "front",
    title: "STAY FERAL",
    idea: "heavy stacked slab capitals, tight and shouting",
  },
  {
    style: "blackletter",
    colour: "White",
    placement: "back",
    title: "NO GODS",
    idea: "dense fraktur capitals with hairline flourishes",
  },
  {
    style: "script-signature",
    colour: "Maroon",
    placement: "front",
    title: "keep going",
    idea: "a flowing brush signature with a long entry flourish",
  },

  // Pictorial — wordless, and deliberately on darker garments.
  {
    style: "blackwork-tattoo",
    colour: "White",
    placement: "back",
    idea: "a stag skull crowned with thistles, solid blackwork with fine dotwork shading",
  },
  {
    style: "manga-ink",
    colour: "White",
    placement: "front",
    idea: "a cat curled asleep inside a cracked teacup, screentone shadows",
  },
  {
    style: "woodcut-flash",
    colour: "Black",
    placement: "both",
    idea: "a hooded elder weighing two planets on a golden scale",
  },
  {
    style: "neo-traditional",
    colour: "Black",
    placement: "front",
    idea: "a clever red fox head framed by chrysanthemum, peony and bluebells, small sparks and decorative leaves",
  },
  {
    style: "folk-woodblock",
    colour: "Red",
    placement: "front",
    idea: "a great wave curling over a small boat, ukiyo-e keyblock and bokashi sky",
  },

  // -------------------------------------------------------------------------
  // Round two — drawn from the reference wall in public/design. Six clusters
  // that wall keeps returning to: Japanese dark (oni, katana, koi), Indian
  // myth in a Sanskrit register, the nature back-print with a wordmark and a
  // quote panel, classical statuary subverted, the split serene/wrathful face,
  // and the slogan plate where type and illustration are one lockup.
  //
  // The slogan pieces file as `illustrated`, never `typographic`: the wall's
  // versions all put words *and* a picture on the same plate, and the
  // typographic family bans illustration outright.
  // -------------------------------------------------------------------------

  // --- Japanese dark -------------------------------------------------------
  {
    style: "irezumi",
    colour: "Black",
    placement: "back",
    idea: "a horned oni mask behind an upright katana, a serpent coiling the blade, wind bars and stylised clouds around them",
  },
  {
    style: "ink-wash",
    colour: "Ash",
    placement: "back",
    idea: "two koi circling nose to tail inside a whirlpool, trailing barbels, splashed ink around the rim",
  },
  {
    style: "blackwork-tattoo",
    colour: "Maroon",
    placement: "front",
    idea: "a chipped katana driven through a cracked stone, splinters and ink spatter thrown upward from the impact",
  },
  // --- The nature back-print ------------------------------------------------
  // The wall's signature shape, and the reason field-guide-plate exists: arched
  // wordmark, one animal drawn straight, the line boxed in its own panel. Every
  // entry here is a premise first and an animal second — the wall's versions
  // work because the caption reframes the picture, not because the animal is
  // well drawn.
  {
    style: "field-guide-plate",
    colour: "Black",
    placement: "back",
    title: "SLOW MOVER",
    quote: "THE ONES IN NO HURRY WERE NEVER THE PREY",
    idea: "a tiger asleep and sprawled along a mossy branch, one paw hanging, vines and a spiderweb slung beneath the limb",
  },
  {
    style: "field-guide-plate",
    colour: "Black",
    placement: "back",
    title: "STILL WATER",
    quote: "NOTHING THAT FLOATS EVER HAD TO SWIM",
    idea: "a crocodile surfacing through a raft of duckweed, only the eyes and the ridge of the back breaking the surface, reeds at the waterline",
  },
  {
    style: "field-guide-plate",
    colour: "Black",
    placement: "back",
    title: "THE WAIT",
    quote: "IT OUTLASTED EVERY FISH THAT DOUBTED IT",
    idea: "a heron standing on one leg in the shallows among cattails, head cocked, dragonflies over the water",
  },
  {
    style: "field-guide-plate",
    colour: "Black",
    placement: "back",
    title: "NO ADDRESS",
    quote: "THEY NEVER ASKED A MAP FOR PERMISSION",
    idea: "three barn swallows cutting across the plate one behind the other, rust throats and forked tails, telegraph wire below",
  },

  // --- Type behind the subject ---------------------------------------------
  // editorial-overlay is the only preset that lets the illustration cross the
  // letterforms. Reserved for the pieces where that overlap IS the design.
  {
    style: "editorial-overlay",
    colour: "White",
    placement: "back",
    title: "UNSEEN",
    quote: "COVERED BUT NEVER CONTAINED",
    idea: "a figure whose head is wound in white cloth, red butterflies lifting off the wrapping one at a time",
  },
  {
    style: "editorial-overlay",
    colour: "White",
    placement: "front",
    title: "MONEY MAKER",
    quote: "WAKE UP AND START MAKING MONEY",
    idea: "two ringed fists crossed over a folded banknote, heavy gold bands on every finger",
  },
  {
    style: "editorial-overlay",
    colour: "White",
    placement: "back",
    title: "NO SIGNAL",
    quote: "EVERYONE REACHABLE AND NOBODY AVAILABLE",
    idea: "a person holding up a phone, their shoulders and arms coming apart into a flock of small birds",
  },

  // --- Engraved plates with a line -----------------------------------------
  {
    style: "occult-almanac",
    colour: "White",
    placement: "back",
    title: "TWO FACES",
    quote: "WHAT BLESSES YOU IS ALSO WHAT DESTROYS YOU",
    idea: "one head split down the centre line, a serene meditating half and a snarling wrathful half, lotus petals beneath the chin",
  },
  {
    style: "occult-almanac",
    colour: "White",
    placement: "back",
    title: "THE COILED",
    quote: "IT SLEEPS AT THE BASE OF THE SPINE",
    idea: "a serpent rising through seven stacked lotus wheels, drawn as an anatomical plate with astrological marginalia",
  },
  {
    style: "occult-almanac",
    colour: "White",
    placement: "back",
    title: "THE HOST",
    quote: "YOU ARE MOSTLY THINGS THAT ARE NOT YOU",
    idea: "a human torso opened like a botanical plate, moths, bees and root systems where the organs should be, each one numbered",
  },

  // --- Indian myth ----------------------------------------------------------
  {
    style: "mythic-broadside",
    colour: "Black",
    placement: "back",
    title: "KALA",
    quote: "TIME DOES NOT KILL IT ONLY WATCHES",
    idea: "a stern lord of endings seated on a buffalo, a noose coiled in one hand, a burning wheel turning behind him",
  },
  {
    style: "mythic-broadside",
    colour: "Black",
    placement: "back",
    title: "TANDAVA",
    quote: "THE DANCE THAT ENDS A WORLD BEGINS ONE",
    idea: "a four-armed dancer mid-step inside a ring of flame, hair loose and thrown wide, a small drum in one raised hand",
  },
  {
    style: "mythic-broadside",
    colour: "Black",
    placement: "front",
    title: "CALM-A-SUTRA",
    quote: "THE ART OF NOT GIVING A DAMN",
    idea: "a cross-legged ascetic in a turban and dark sunglasses, palms turned up, a hexagonal mandala behind him",
  },

  // --- Anime key visuals ----------------------------------------------------
  {
    style: "anime-villain",
    colour: "Black",
    placement: "back",
    title: "THE OATH",
    quote: "I KEPT THE PROMISE THAT COST ME EVERYTHING",
    idea: "a swordsman lowering a notched blade, half his face lost to shadow, embers drifting across the frame",
  },
  {
    style: "anime-poster",
    colour: "Black",
    placement: "back",
    title: "LAST BUS",
    quote: "HE LET IT GO AND WALKED HOME INSTEAD",
    idea: "a boy at a rain-lit bus stop watching the taillights pull away, puddles holding the light",
  },

  // --- No type at all -------------------------------------------------------
  // The wall is not all lockups. These two are the pieces that carry a joke or
  // a contradiction in the picture alone, so adding a caption would flatten it.
  // Both keyed against black and cut out, so the garment is free — light stock
  // chosen because both palettes are mid-tone and would sink into a dark tee.
  {
    style: "vintage-riso",
    colour: "White",
    placement: "front",
    idea: "a bearded marble philosopher bust in round sunglasses, drinking from a takeaway cup through a straw",
  },
  {
    style: "surreal-collage",
    colour: "Ash",
    placement: "front",
    idea: "a cracked marble head with a torn band across the eyes, an anatomical skull showing through the tear, magnolia sprigs at the neck",
  },
]

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
/** 1-based index into PLAN. Lets a later run pick up only the entries added
 *  since an earlier one, instead of regenerating everything that already
 *  exists — the plan is ordered and append-only, so an offset is enough. */
const from = Math.max(1, Number(flag("from") ?? 1))

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

// Colour names come from the plan; Printify wants a variant id. Resolved once,
// against the same sellable set the product will actually enable.
const garment = defaultGarment()
if (!garment) {
  console.error("Printify is not configured — designs would have no product.")
  process.exit(1)
}
const variantIdByColour = new Map(
  coloursFrom(sellableVariants(garment, await catalogVariants(garment))).map(
    (option) => [option.colour, option.variantId]
  )
)

const plan = PLAN.slice(from - 1, from - 1 + count)

// Titles have to be unique. Two shirts reading PROMETHEUS is two shirts nobody
// can tell apart in a feed, and the plan is append-only so a repeat is easy to
// write by accident. Checked against the plan itself and against everything
// already generated, before a single image is paid for.
{
  const planned = plan.map((c) => c.title).filter(Boolean) as string[]
  const dupes = planned.filter((t, i) => planned.indexOf(t) !== i)
  if (dupes.length > 0) {
    console.error(`Duplicate titles in the plan: ${[...new Set(dupes)].join(", ")}`)
    process.exit(1)
  }

  const existing = await db.select<{ text_content: string }[]>(
    "generation_jobs?select=text_content&text_content=not.is.null"
  )
  const taken = new Set(existing.map((row) => row.text_content))
  const clashes = planned.filter((t) => taken.has(t))
  if (clashes.length > 0) {
    console.error(`Already generated: ${[...new Set(clashes)].join(", ")}`)
    console.error("Change the title or use --from to skip past them.")
    process.exit(1)
  }
}

for (const [i, concept] of plan.entries()) {
  const style = findStyle(concept.style)
  const label = `[${String(i + 1).padStart(2, "0")}/${plan.length}] ${concept.style}`

  if (!style) {
    console.error(`${label}  FAILED  no such style preset`)
    continue
  }

  const vibe = vibes.find((v) => v.slug === style.vibeSlug)
  if (!vibe) {
    console.error(`${label}  FAILED  style files under unknown vibe ${style.vibeSlug}`)
    continue
  }
  if (vibeSlug && vibe.slug !== vibeSlug) continue

  // A full-bleed style prints its own ground, so the shirt has to match it —
  // otherwise the plate reads as a rectangle sitting on the garment.
  const required = requiredColourFor(style)
  if (required && concept.colour !== required) {
    console.error(
      `${label}  FAILED  ${style.slug} is full-bleed and needs a ${required} garment, not ${concept.colour}`
    )
    continue
  }

  const featuredVariantId = variantIdByColour.get(concept.colour)
  if (!featuredVariantId) {
    console.error(`${label}  FAILED  ${concept.colour} is not a sellable colour`)
    continue
  }

  const idea = concept.idea

  if (dryRun) {
    console.log(
      `${label}  ${concept.colour}/${concept.placement}  ${concept.title ? `"${concept.title}" — ` : ""}${idea.slice(0, 60)}`
    )
    continue
  }

  let jobId: string | null = null

  try {
    const job = await db.insert<{ id: string }>("generation_jobs", {
      user_id: owner.id,
      vibe_id: vibe.id,
      quality_tier: "medium",
      style_slug: style.slug,
      text_content: concept.title ?? null,
      quote_content: concept.quote ?? null,
      status: "generating",
    })
    jobId = job.id

    // The app's own adapter, not a copy of it: same MuAPI calls, same prompt,
    // same background cut, so a seeded design is byte-for-byte the kind of thing
    // the create flow produces.
    const image = await generate({
      prompt: buildPrompt({
        idea,
        style,
        text: concept.title ?? null,
        quote: concept.quote ?? null,
      }),
      references: [],
      aspectRatio: "3:4",
      quality: "medium",
    })

    // House stock is generated and listed in one pass, with no maker to press
    // the button, so the cut that the create flow now leaves to the user still
    // happens here. Full-bleed plates are exempt for the same reason as ever:
    // the remover keeps the character and deletes the title and the line.
    const finished = style.fullBleed
      ? image
      : await removeBackground(await db.upload(`${job.id}-raw.png`, image.bytes)).catch(
          (error: unknown) => {
            console.error(`[seed] background removal failed for ${job.id}:`, error)
            return image
          }
        )

    const imageUrl = await db.upload(`${job.id}.png`, finished.bytes)

    const design = await db.insert<{ id: string }>("designs", {
      vibe_id: vibe.id,
      generation_job_id: job.id,
      creator_id: owner.id,
      image_url: imageUrl,
      prompt: idea,
      price_cents: priceCents,
      // The garment config the earlier round-robin never set, which is why every
      // seeded design came out as a white tee with a front print.
      garment_slug: garment.slug,
      featured_variant_id: featuredVariantId,
      placement: concept.placement,
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

    // Mark the job dead. Without this a failed run is left on `generating`,
    // which is indistinguishable from one still in flight — so a batch that
    // half-failed reads as a batch still working.
    if (jobId) {
      await db
        .patch("generation_jobs", `id=eq.${jobId}`, { status: "failed" })
        .catch(() => {})
    }
  }
}

if (!dryRun) {
  console.log(`\n${created}/${count} designs created.`)
  if (created < count) console.log("Re-run to fill the gap; failures wrote nothing.")
}
