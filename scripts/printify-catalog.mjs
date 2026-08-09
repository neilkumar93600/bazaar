#!/usr/bin/env node
/**
 * Prints the ids Printify needs in .env.local. Run it once during setup; nothing
 * in the app calls it.
 *
 *   node scripts/printify-catalog.mjs              shops + blueprints matching "shirt"
 *   node scripts/printify-catalog.mjs tote         blueprints matching another term
 *   node scripts/printify-catalog.mjs 6            print providers for blueprint 6
 *   node scripts/printify-catalog.mjs 6 99         variants for blueprint 6, provider 99
 *
 * Catalog endpoints are rate limited to 100 requests/minute, which this is in no
 * danger of reaching.
 */
import { readFileSync } from "node:fs"

// Reads .env.local rather than requiring the token to be exported. Deliberately
// naive — it only has to find one key in a file the developer already has.
function envFromFile(key) {
  try {
    const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    const line = file.split("\n").find((l) => l.trim().startsWith(`${key}=`))
    return line ? line.slice(line.indexOf("=") + 1).trim() : undefined
  } catch {
    return undefined
  }
}

const token = process.env.PRINTIFY_API_TOKEN || envFromFile("PRINTIFY_API_TOKEN")

if (!token) {
  console.error("Set PRINTIFY_API_TOKEN (env or .env.local) first.")
  process.exit(1)
}

async function api(path) {
  const response = await fetch(`https://api.printify.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "ShirtBazaar-setup",
    },
  })
  if (!response.ok) {
    console.error(`${response.status} on ${path}: ${await response.text()}`)
    process.exit(1)
  }
  return response.json()
}

const [first, second] = process.argv.slice(2)
const blueprintId = Number(first)

if (Number.isInteger(blueprintId) && blueprintId > 0) {
  const providerId = Number(second)

  if (Number.isInteger(providerId) && providerId > 0) {
    const { variants } = await api(
      `/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
    )
    console.log(`\nVariants for blueprint ${blueprintId} / provider ${providerId}\n`)
    for (const variant of variants) console.log(`  ${variant.id}  ${variant.title}`)
    console.log(`\n  ${variants.length} variants.`)
    console.log("  All of them go on sale — the buyer picks colour and size at")
    console.log("  checkout, so there is nothing to configure here.\n")
  } else {
    const providers = await api(
      `/v1/catalog/blueprints/${blueprintId}/print_providers.json`
    )
    console.log(`\nPrint providers for blueprint ${blueprintId}\n`)
    for (const provider of providers) console.log(`  ${provider.id}  ${provider.title}`)
    console.log("\nPRINTIFY_PRINT_PROVIDER_ID = one of the above.")
    console.log(`Then: node scripts/printify-catalog.mjs ${blueprintId} <provider id>\n`)
  }
} else {
  const term = (first ?? "shirt").toLowerCase()

  const shops = await api("/v1/shops.json")
  console.log("\nShops\n")
  for (const shop of shops) {
    console.log(`  ${shop.id}  ${shop.title} (${shop.sales_channel})`)
  }
  console.log("\nPRINTIFY_SHOP_ID = one of the above.")

  const blueprints = await api("/v1/catalog/blueprints.json")
  const matches = blueprints.filter((b) =>
    `${b.title} ${b.brand} ${b.model}`.toLowerCase().includes(term)
  )
  console.log(`\nBlueprints matching "${term}"\n`)
  for (const blueprint of matches.slice(0, 40)) {
    console.log(`  ${blueprint.id}  ${blueprint.brand} ${blueprint.model} — ${blueprint.title}`)
  }
  console.log(`\n  ${matches.length} matches (showing up to 40).`)
  console.log("PRINTIFY_BLUEPRINT_ID = one of the above.")
  console.log("Then: node scripts/printify-catalog.mjs <blueprint id>\n")
}
