#!/usr/bin/env node
/**
 * Re-points a design's featured colour and re-fetches its hero mockup.
 *
 *   npx tsx scripts/refeature-mockups.ts --style mythic-broadside --colour Black
 *   npx tsx scripts/refeature-mockups.ts --style a,b,c --colour Black --dry
 *
 * `featured_variant_id` only decides which of Printify's ~66 renders is shown
 * in the bazaar — it is not what anyone buys — so changing it is a data fix,
 * never a reason to re-mint. That is why this is safe on designs whose garment
 * config is otherwise frozen.
 *
 * Written for a specific failure: full-bleed styles (the illustrated
 * broadsides) keep their dark ground through background removal, because the
 * ornamental border makes the whole plate read as one object. A design like
 * that featured on a navy or maroon garment shows a black rectangle. The plate
 * needs a black shirt.
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

import {
  coloursFrom,
  defaultGarment,
  sellableVariants,
} from "../lib/printify/garments.ts"
import { catalogVariants, fetchProductMockup } from "../lib/printify/products.ts"

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const eq = t.indexOf("=")
  if (eq > 0) process.env[t.slice(0, eq).trim()] ??= t.slice(eq + 1).trim()
}

const args = process.argv.slice(2)
function flag(name: string): string | undefined {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? undefined : args[index + 1]
}

const styles = (flag("style") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const colour = flag("colour")
const dryRun = args.includes("--dry")
/** Re-pick every design's hero mockup from its own stored placement, without
 *  touching the featured colour. This is the repair for back-print designs that
 *  were photographed from the front — a picture of a blank shirt. */
const all = args.includes("--all")

if (styles.length === 0 && !all) {
  console.error("--style is required, or --all to re-pick every design's mockup")
  process.exit(1)
}

const garment = defaultGarment()
if (!garment) {
  console.error("Printify is not configured.")
  process.exit(1)
}

const variantId = colour
  ? coloursFrom(sellableVariants(garment, await catalogVariants(garment))).find(
      (option) => option.colour === colour
    )?.variantId
  : null

if (colour && !variantId) {
  console.error(`${colour} is not a sellable colour for ${garment.slug}.`)
  process.exit(1)
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

let designIds: string[] | null = null

if (!all) {
  // The style lives on the job, not the design, so the set is resolved there.
  const { data: jobs } = await admin
    .from("generation_jobs")
    .select("result_design_id, style_slug")
    .in("style_slug", styles)
    .not("result_design_id", "is", null)

  designIds = [...new Set((jobs ?? []).map((j) => j.result_design_id))]
}

let query = admin
  .from("designs")
  .select("id, printify_product_id, featured_variant_id, placement")
  .not("printify_product_id", "is", null)

if (designIds) query = query.in("id", designIds)

const { data: designs } = await query

const list = (designs ?? []).filter(
  (d) => all || d.featured_variant_id !== variantId
)
console.log(
  `${list.length} design(s) to re-feature on ${colour} (variant ${variantId})${dryRun ? " — DRY RUN" : ""}`
)

let done = 0
for (const [index, design] of list.entries()) {
  const label = `[${index + 1}/${list.length}] ${design.id.slice(0, 8)}`

  if (dryRun) {
    console.log(
      `${label}  placement=${design.placement ?? "front"}  variant ${design.featured_variant_id} -> ${variantId ?? design.featured_variant_id}`
    )
    continue
  }

  // Keep the design's own colour in --all mode; only --colour moves it.
  const targetVariant = variantId ?? design.featured_variant_id
  const placement = (design.placement ?? "front") as "front" | "back" | "both"

  const mockupUrl = await fetchProductMockup(
    design.printify_product_id!,
    targetVariant,
    placement
  )

  const { error } = await admin
    .from("designs")
    .update({
      featured_variant_id: targetVariant,
      // Only overwrite the mockup when a better one was actually found; the
      // stored one is still a real render of this product.
      ...(mockupUrl ? { mockup_url: mockupUrl } : {}),
    })
    .eq("id", design.id)

  if (error) {
    console.log(`${label}  FAILED  ${error.message}`)
    continue
  }

  done++
  console.log(
    `${label}  ok  placement=${placement}  ${mockupUrl ? "mockup updated" : "mockup unchanged"}`
  )
}

if (!dryRun) console.log(`\n${done}/${list.length} re-featured.`)
