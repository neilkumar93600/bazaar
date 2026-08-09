#!/usr/bin/env node
/**
 * Mints the Printify product for any design that is missing one.
 *
 *   npx tsx scripts/backfill-products.ts
 *
 * Exists because syncDesignProduct swallows its failures by design — a design
 * row is already committed by the time it runs, so a throw there would surface
 * as a server error for a request that already succeeded. The cost of that is
 * that a broken sync is silent, and this is the repair.
 *
 * Safe to re-run: syncDesignProduct returns early once a product exists.
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

import { syncDesignProduct } from "../lib/printify/sync.ts"

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const eq = t.indexOf("=")
  if (eq > 0) process.env[t.slice(0, eq).trim()] ??= t.slice(eq + 1).trim()
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const { data: designs } = await admin
  .from("designs")
  .select("id")
  .is("printify_product_id", null)
  .order("created_at", { ascending: true })

const list = designs ?? []
console.log(`${list.length} design(s) without a Printify product`)

let done = 0
for (const [index, design] of list.entries()) {
  const label = `[${index + 1}/${list.length}] ${design.id.slice(0, 8)}`
  await syncDesignProduct(design.id)

  const { data: row } = await admin
    .from("designs")
    .select("printify_product_id, mockup_url")
    .eq("id", design.id)
    .maybeSingle()

  if (row?.printify_product_id) {
    done++
    console.log(`${label}  ok  product ${row.printify_product_id}  mockup ${row.mockup_url ? "yes" : "pending"}`)
  } else {
    console.log(`${label}  FAILED (see the [printify] error above)`)
  }
}

console.log(`\n${done}/${list.length} minted.`)
