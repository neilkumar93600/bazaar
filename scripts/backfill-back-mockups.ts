#!/usr/bin/env node
/**
 * Fills `back_mockup_url` for designs whose Printify product already exists
 * but was minted before createDesignProduct started always fetching the back
 * camera (previously gated on `placement === "both"`).
 *
 *   npx tsx scripts/backfill-back-mockups.ts
 *   npx tsx scripts/backfill-back-mockups.ts --dry
 *
 * No re-mint: the product already has every camera angle rendered (Printify
 * shoots them all regardless of print placement), this just reads the back
 * one off the existing product and stores it. Safe to re-run.
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

import { fetchProductMockup } from "../lib/printify/products.ts"

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const eq = t.indexOf("=")
  if (eq > 0) process.env[t.slice(0, eq).trim()] ??= t.slice(eq + 1).trim()
}

const dryRun = process.argv.includes("--dry")

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const { data: designs } = await admin
  .from("designs")
  .select("id, printify_product_id, featured_variant_id, placement")
  .not("printify_product_id", "is", null)
  .is("back_mockup_url", null)
  .order("created_at", { ascending: true })

const list = designs ?? []
console.log(`${list.length} design(s) missing a back mockup${dryRun ? " — DRY RUN" : ""}`)

let done = 0
for (const [index, design] of list.entries()) {
  const label = `[${index + 1}/${list.length}] ${design.id.slice(0, 8)}`

  if (dryRun) {
    console.log(`${label}  would fetch  placement=${design.placement ?? "front"}`)
    continue
  }

  const backMockupUrl = await fetchProductMockup(
    design.printify_product_id!,
    design.featured_variant_id,
    "back"
  )

  if (!backMockupUrl) {
    console.log(`${label}  no back render found on the product yet`)
    continue
  }

  const { error } = await admin
    .from("designs")
    .update({ back_mockup_url: backMockupUrl })
    .eq("id", design.id)

  if (error) {
    console.log(`${label}  FAILED  ${error.message}`)
    continue
  }

  done++
  console.log(`${label}  ok`)
}

if (!dryRun) console.log(`\n${done}/${list.length} backfilled.`)
