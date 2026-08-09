# Garment configuration and real mockups

Date: 2026-08-09
Status: approved, ready to plan

**Sub-project D** of five. Depends on **A** (ownership & listing) and **B**
(create v2), both built. Blocks **E** (buyer ordering).

## Problem

A maker picks a design and lists it. Nothing in between asks what it is printed
on. The Printify integration works — the design in the database has a real
`printify_product_id` and `mockup_url` — but it is hardwired to one garment via
`PRINTIFY_BLUEPRINT_ID` / `PRINTIFY_PRINT_PROVIDER_ID`, enables every pinned
variant at one price, and prints front only
(`lib/printify/products.ts` hardcodes `position: "front"`).

So: no garment choice, no colour choice, no placement choice, and the mockup
shown in the bazaar is whichever image Printify happened to mark default rather
than the one the maker would have picked.

## Scope

The maker's side of the physical product: which garment, which colour, where
the print goes, and the real photo that results.

Out of scope, deferred to **E**:

- The buyer choosing a variant at checkout, and real Printify **order**
  submission (`/v1/shops/{id}/orders.json`). D creates *products*; nothing in
  the repo has ever created an order.
- Maker-set garment pricing. D prices per garment, in config.

Out of scope, deferred indefinitely:

- Changing a garment after the product is minted. See "Immutability" below.
- `designs.print_ready_back_url` — both placements reuse the display image.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Whose garment choice is real | **Maker sets the featured mockup; the buyer picks what actually gets made.** | The maker's pick is presentation — it decides the hero image in the bazaar. One product carries every variant, so a buyer who wants a different colour is not blocked by someone else's taste. |
| Garment range | **Configured data, not code.** A `Garment[]` of blueprint/provider pairs; colours, sizes and variant ids fetched live from Printify's catalogue. | "Whatever the shop has" is not a thing Printify exposes — a shop holds *products*, and blueprints are a global ~1000-entry catalogue. Configured pairs are the buildable version of the same intent: adding a hoodie is a row, not a refactor. |
| Colour and size | **Derived from variant titles, never a fixed palette.** | Printify fuses both into one variant (`"Black / M"`). Not every colour carries every size, so sizes must be derived *per selected colour*. |
| Placement | `front` \| `back` \| `both`, where **`both` means a small chest mark and a full back print** | The classic two-sided layout, and the one the maker asked for. Both placements reuse the same image. |
| Preview | **The drawn `ShirtMockup`, recoloured** — not a Printify render | The real mockup only exists after the product is minted, and A deliberately moved minting to listing time so unlisted designs cost nothing. Previewing with the drawing keeps that property and is instant. |
| Mutability | **Config is frozen once the product is minted.** | `syncDesignProduct` early-returns when `printify_product_id` is set, so a later change would either be silently ignored or orphan a product in the Printify shop. Freezing is honest; product deletion is a later pass. |

## Architecture

### Garment catalogue — `lib/printify/garments.ts`

```ts
export type Garment = {
  slug: string           // "tee"
  label: string          // "T-shirt"
  blueprintId: number
  printProviderId: number
  /** Retail price in cents — what a buyer pays. Printify bills cost
   *  separately; the margin is the difference. */
  priceCents: number
}
```

Ships with one entry, built from the existing `PRINTIFY_BLUEPRINT_ID` /
`PRINTIFY_PRINT_PROVIDER_ID` so nothing configured today breaks. Adding a
garment is appending to the array.

`Garment.priceCents` **replaces `FALLBACK_GARMENT_PRICE_CENTS`**, the constant
sub-project A added to `lib/printify/sync.ts` when `designs.price_cents` became
nullable. There must be exactly one garment price in the system, and this is it;
`designs.price_cents` goes back to meaning only what a claimer pays for
ownership.

`PRINTIFY_VARIANT_IDS` loses its meaning and is removed: a product now carries
every variant the provider offers, because the buyer — not the env file — picks
the colour. That means `printifyConfig()` drops the field, `resolveVariantIds`
always resolves from the catalogue, and `.env.example` loses the line.

### Variants: parsing colour and size

Printify returns `{ id, title }` where title is `"Black / M"`.

```ts
export type Variant = { id: number; colour: string; size: string }

/** Titles are `"<colour> / <size>"`. A title without a separator has no size
 *  axis (some blueprints are one-size), so the whole title is the colour and
 *  size is "One size". */
export function parseVariant(raw: { id: number; title: string }): Variant
```

Grouping for the UI:

- **Colours** — distinct `colour` values, in catalogue order.
- **Sizes for a colour** — the sizes present *on that colour*. Never a global
  size list: a colour that only comes in S–XL must not offer 2XL.

**The maker picks a colour, not a variant.** They are not buying a shirt — size
is the buyer's decision in E — so the config UI shows swatches only.
`featured_variant_id` therefore stores the **first variant of the chosen
colour**, as a stand-in for that colour, and exists purely so `pickMockup` can
find the right render. `listDesign` still receives a variant id rather than a
colour string, because an id is what the catalogue can validate against; the
grouping helper hands the UI the representative id per colour.

Size grouping is nonetheless built here, not in E: it is the same parse, and
splitting it across two sub-projects means writing the matrix logic twice.

The catalogue fetch already has a process-lifetime promise cache
(`lib/printify/products.ts`), keyed per blueprint/provider. That cache moves
into `garments.ts` and becomes keyed by both, since there is now more than one
pair.

### Print areas

`printAreas()` currently emits one `front` placeholder at `scale: 1`. It becomes
placement-driven:

| Placement | Front placeholder | Back placeholder |
| --- | --- | --- |
| `front` | `x .5, y .5, scale 1` | — |
| `back` | — | `x .5, y .5, scale 1` |
| `both` | `x .5, y .28, scale .32` | `x .5, y .5, scale 1` |

`both`'s front mark is centred-high, not left-chest. The generator produces 3:4
portrait illustrations; shrunk into a left-chest corner they lose all their
detail and read as a mistake. Centred at 32% reads as intentional.

Getting the `both` row backwards prints a giant chest logo and a postage-stamp
back, so it is the thing the test pins.

### Mockup selection

Printify renders ~66 images per product — every camera angle × every enabled
colour — and each carries `variant_ids`. `pickMockup` currently takes
`is_default`, then a `camera_label=front` match, then whatever came first.

It gains the maker's `featured_variant_id` and prefers, in order:

1. a front-camera image whose `variant_ids` includes the featured variant,
2. any image whose `variant_ids` includes it,
3. the existing default-first fallback chain.

So `designs.mockup_url` stops meaning "some mockup" and starts meaning "the
maker's chosen colour, from the front".

### Schema

```sql
alter table public.designs
  add column garment_slug        text,
  add column featured_variant_id integer,
  add column placement           text check (placement in ('front', 'back', 'both'));
```

All nullable: the one design that predates this has no config, and the drawn
mockup covers it. No backfill — a design minted before D keeps its product and
its default mockup.

### Listing form

A's `ListingForm` grows a garment section above the price. One panel, one
submit, on both surfaces that use it (`/create` after picking from the grid,
`/dashboard/designs` for anything unlisted).

`listDesign(designId, free, dollars)` becomes
`listDesign(designId, config, free, dollars)` where config is
`{ garmentSlug, variantId, placement }`. It is validated server-side against the
live catalogue — a variant id that does not belong to the named garment is
rejected, not trusted.

**Read-only after minting.** When `printify_product_id` is set, the garment
section renders the chosen values without controls. RLS still permits the
update; the form simply does not offer it, and `listDesign` ignores a config for
a design that already has a product rather than silently orphaning one.

### Preview colours

`ShirtMockup` hashes a tone out of the image URL today. It gains an optional
explicit tone, resolved from the Printify colour *name*:

- A table of ~15 common Printify colour names → base hex (Black, White, Navy,
  Sport Grey, Heather Grey, Maroon, Forest, Royal, Red, Charcoal, Sand, …).
- `shade`, `deep` and `seam` derived by scaling the base's luminance, rather
  than hand-authoring four channels per colour.
- An unknown name falls back to the existing hashed tone, so a garment added
  later never renders as a hole.

This is approximate by construction. A maker picking "Forest Green" sees *a*
green tee, not Printify's exact green. The real photo replaces it at listing.

## Verification

Extending the existing convention (`npx tsx <file>.test.ts`, `node:assert/strict`):

`lib/printify/garments.test.ts`

- **Variant parsing** — `"Black / M"` splits; `"One Size"` with no separator
  yields the whole title as colour; doubled spaces and padding are trimmed.
- **Sizes are per colour, not global.** Given a matrix where Black has S/M/L and
  White has only S, asking for White's sizes returns `["S"]`. This is the rule
  that stops the UI offering a variant that cannot be ordered.
- **Colour → tone** — a known name maps, an unknown name falls back without
  throwing.

`lib/printify/print-areas.test.ts`

- Each placement produces the expected placeholders, and `both` puts **scale
  0.32 on the front and scale 1 on the back** — asserted explicitly, in that
  direction, because reversing it is the failure that looks plausible.

Not unit-testable, checked by hand once against the live Printify shop: that a
product minted with `placement: "both"` renders a mockup with a small chest mark
and a full back, and that the featured mockup matches the colour the maker
picked.

## Risks

- **Printify can renumber variants.** Ids are cached per process and refetched
  on restart. A change mid-flight makes one product wrong; nothing detects it.
- **Non-tee print areas have different aspect ratios.** A tote's print area is
  not 3:4, so 3:4 artwork will letterbox. Only bites when a second garment is
  configured, which is why D ships with one.
- **The drawn preview is not the product photo** — approximate colour, and
  always a tee outline even if the garment is a hoodie.
- **Frozen config is a real limitation.** A maker who picks the wrong colour has
  no way back short of generating again.
- **One retail price per garment**, set in config, identical for every design.
  Maker-set garment pricing is not designed here.
- **Removing `PRINTIFY_VARIANT_IDS` widens every product to the provider's full
  variant list.** That is the intent — the buyer picks — but it means a provider
  offering 60 variants mints a 60-variant product, and Printify renders mockups
  for all of them.

## Downstream

`syncDesignProduct` gains the garment, variant and placement, so its signature
and its early-return both change. It is called from `listDesign` (A) and from
`claimDesign`'s backfill (A) — the backfill path has no config to pass and must
keep working for designs that predate D, falling back to the configured default
garment and `placement: 'front'`.
