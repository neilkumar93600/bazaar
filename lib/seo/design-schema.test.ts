/** Run: `npx tsx lib/seo/design-schema.test.ts`
 *
 *  ponytail: assert-based, no framework. The branching is the whole point —
 *  emitting a Product for a design nobody can order is a structured-data policy
 *  violation, not a missed opportunity, and a price in cents where schema wants
 *  dollars would publish a $2,400 shirt as its price.
 */

import assert from "node:assert/strict"

import { designJsonLd, type DesignSchemaInput } from "./design-schema"

const base: DesignSchemaInput = {
  id: "7d4179ef-96ad-4204-9e42-379191ba8246",
  name: "Tiger Moving Softly Through River Currents",
  description: "A tiger mid-stride through braided water.",
  imageUrl: "https://images-api.printify.com/mockup/abc/front.jpg",
  vibeName: "Dusk Atelier",
  canOrder: true,
  garmentPriceCents: 2499,
  creatorName: "Riot",
}

const typesOf = (blocks: object[]) =>
  blocks.map((b) => (b as { "@type": string })["@type"])

// A claimed, orderable design is a product page.
{
  const blocks = designJsonLd(base)
  assert.deepEqual(typesOf(blocks), ["BreadcrumbList", "Product"])

  const product = blocks[1] as {
    name: string
    sku: string
    image: string
    brand: { name: string }
    offers: { price: string; priceCurrency: string; availability: string; url: string }
  }
  assert.equal(product.name, base.name)
  assert.equal(product.sku, base.id)
  assert.equal(product.brand.name, "Riot")
  assert.equal(product.offers.price, "24.99", "cents must be rendered as dollars")
  assert.equal(product.offers.priceCurrency, "USD")
  assert.equal(product.offers.availability, "https://schema.org/InStock")
  assert.match(product.offers.url, /\/design\/7d4179ef/)
}

// Not orderable — unclaimed, or claimed with no Printify product behind it
// (lib/orders/eligibility.ts refuses both), so it is not a Product.
{
  const blocks = designJsonLd({ ...base, canOrder: false })
  assert.deepEqual(
    typesOf(blocks),
    ["BreadcrumbList"],
    "schema must never advertise an order the server would refuse",
  )
}

// Printify unreachable — no price means no Offer, and a Product without an
// Offer earns nothing, so the breadcrumb stands alone.
{
  const blocks = designJsonLd({ ...base, garmentPriceCents: null })
  assert.deepEqual(typesOf(blocks), ["BreadcrumbList"], "no Product without a price")
}

// Breadcrumbs mirror the visible trail, vibe included or omitted.
{
  const withVibe = designJsonLd(base)[0] as {
    itemListElement: { position: number; name: string }[]
  }
  assert.deepEqual(
    withVibe.itemListElement.map((i) => i.name),
    ["Home", "Bazaar", "Dusk Atelier", base.name],
  )
  assert.deepEqual(
    withVibe.itemListElement.map((i) => i.position),
    [1, 2, 3, 4],
    "positions must be 1-based and contiguous",
  )

  const noVibe = designJsonLd({ ...base, vibeName: null })[0] as {
    itemListElement: { name: string }[]
  }
  assert.deepEqual(
    noVibe.itemListElement.map((i) => i.name),
    ["Home", "Bazaar", base.name],
  )
}

// Optional fields drop out rather than emitting empty strings, which fail
// validation.
{
  const blocks = designJsonLd({
    ...base,
    description: null,
    imageUrl: null,
    creatorName: null,
  })
  const product = blocks[1] as Record<string, unknown>
  assert.equal("description" in product, false)
  assert.equal("image" in product, false)
  assert.equal("brand" in product, false)
  assert.equal(product.name, base.name, "required fields still present")
}

// A relative image path must be absolutised — a relative URL invalidates the
// block.
{
  const blocks = designJsonLd({ ...base, imageUrl: "/bazaar/shot.jpg" })
  const product = blocks[1] as { image: string }
  assert.match(product.image, /^https?:\/\/.+\/bazaar\/shot\.jpg$/)
}

// Free listings are a real state, and 0 is a valid price — it must not be
// mistaken for "no price" and drop the Offer.
{
  const blocks = designJsonLd({ ...base, garmentPriceCents: 0 })
  assert.deepEqual(typesOf(blocks), ["BreadcrumbList", "Product"])
  const product = blocks[1] as { offers: { price: string } }
  assert.equal(product.offers.price, "0.00")
}

console.log("design-schema.test.ts OK")
