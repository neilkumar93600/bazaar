#!/usr/bin/env node
/**
 * Moves every already-minted design onto real dual-side printing: re-mints
 * its Printify product with placement="both" (small front mark, full back
 * art — see lib/printify/print-areas.ts), replacing the flat-art composite
 * preview with a genuine printed-and-photographed back, matching quality on
 * both sides.
 *
 *   npx tsx scripts/remint-both.ts --dry
 *   npx tsx scripts/remint-both.ts
 *
 * Deliberately orphans each design's existing Printify product — re-minting
 * is the only way to add a print area Printify didn't create the product
 * with. Printify doesn't bill for an unsold product, so the orphan costs
 * nothing; this is the one-off migration remintDesignProduct exists for.
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

import { remintDesignProduct } from "../lib/printify/sync.ts"

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
  .select("id, placement")
  .not("printify_product_id", "is", null)
  .order("created_at", { ascending: true })

// Client-side filter, not `.neq("placement", "both")`: a null column fails a
// SQL `<> 'both'` (NULL is neither equal nor unequal), which would silently
// drop every legacy design that predates the placement column.
const list = (designs ?? []).filter((d) => d.placement !== "both")
console.log(`${list.length} design(s) to re-mint onto both sides${dryRun ? " — DRY RUN" : ""}`)

let done = 0
for (const [index, design] of list.entries()) {
  const label = `[${index + 1}/${list.length}] ${design.id.slice(0, 8)}`

  if (dryRun) {
    console.log(`${label}  would re-mint  placement ${design.placement ?? "front"} -> both`)
    continue
  }

  const ok = await remintDesignProduct(design.id, "both")
  console.log(`${label}  ${ok ? "ok" : "FAILED (see the [printify] error above)"}`)
  if (ok) done++
}

if (!dryRun) console.log(`\n${done}/${list.length} re-minted.`)
