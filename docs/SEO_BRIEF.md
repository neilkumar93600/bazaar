# Shirt Bazaar — SEO/AEO Brief

Scope: homepage + public surfaces. Grounded in [PRD.md](PRD.md). Volume/difficulty
figures below are **estimates** — validate in Ahrefs/SEMrush before committing spend.

## Positioning

One-line: **One prompt. One shirt. One owner.**

The defensible angle is not "AI t-shirt generator" (crowded, dominated by Printful,
Redbubble, Teespring, and a dozen AI-merch SaaS). It is **exclusivity + ownership +
resale royalty**. Own that intersection first, then climb toward the head term.

## Keyword tiers

### Tier 1 — target now (difficulty < 45)

| Keyword | Est. volume | Est. difficulty | Intent |
|---|---|---|---|
| one of one t shirt | Low | 22 | Commercial |
| ai generated t shirt design | Medium | 34 | Commercial |
| exclusive ai apparel | Low | 26 | Commercial |
| own the design you buy | Low | 19 | Informational |
| resale royalties for creators | Low | 31 | Informational |
| 1 of 1 streetwear | Low | 28 | Commercial |

### Tier 2 — build toward (45–60)

| Keyword | Est. volume | Est. difficulty | Intent |
|---|---|---|---|
| ai t shirt design generator | High | 52 | Commercial |
| sell ai generated designs | Medium | 48 | Transactional |
| custom ai clothing | Medium | 55 | Commercial |
| creator storefront platform | Medium | 49 | Commercial |

### Tier 3 — long-term only (>60)

`custom t shirts` (78), `print on demand` (72), `ai art generator` (85). Do not
target these directly; earn them via cluster authority.

## AEO / question queries

Answer format matters more than keyword placement — AI engines cite the block, not
the page.

1. **"What is a 1-of-1 AI t-shirt?"** → definition sentence, first 40 words of the answer block.
2. **"Do you own the design when you buy an AI-generated shirt?"** → direct yes/no + one clause of qualification.
3. **"How do resale royalties on apparel work?"** → numbered steps (3 steps, matches the PRD core loop).
4. **"How is Shirt Bazaar different from print-on-demand?"** → comparison table.
5. **"How much does a 1-of-1 AI shirt cost?"** → direct number + tier range.
6. **"Can I sell AI-generated designs I didn't draw?"** → definition + ownership clause.

## Cannibalization check

- `one of one t shirt` vs `1 of 1 streetwear` — **near-duplicate intent.** Homepage owns
  `one of one t shirt`; give `1 of 1 streetwear` to a vibe/category page, not a second landing page.
- `ai generated t shirt design` vs `ai t shirt design generator` — different intent
  (browse vs. tool). Homepage owns the first; `/create` owns the second.
- `exclusive ai apparel` vs `custom ai clothing` — keep both on homepage; they are
  the same page's primary and semantic variant.

## Content map (production order)

| # | Page | Type | Primary keyword |
|---|---|---|---|
| 1 | `/` | Landing | one of one t shirt |
| 2 | `/faq` | FAQ + FAQPage schema | all 6 AEO questions |
| 3 | `/blog/what-is-a-1-of-1-ai-shirt` | Pillar | ai generated t shirt design |
| 4 | `/blog/how-resale-royalties-work` | Cluster | resale royalties for creators |
| 5 | `/creator/[handle]` | Programmatic | `{handle} 1-of-1 designs` |
| 6 | `/design/[id]` | Programmatic + Product schema | long-tail design titles |

Pages 5–6 are the programmatic scale play — they already exist as routes and are the
largest indexable surface. They need unique titles/descriptions per record or they
will be treated as thin duplicates.

## Roadmap

**Phase 1 (weeks 1–4) — foundation.** Homepage copy (done), per-route `metadata`
exports for `/creator/[handle]` and `/design/[id]`, `sitemap.ts`, `robots.ts`,
Organization + WebSite schema, analytics.

**Phase 2 (weeks 5–12) — expansion.** FAQ page with FAQPage schema, Product schema on
design pages, first two blog posts, internal links from vibe tiles to category pages.

**Phase 3 (weeks 13–24) — scale.** Programmatic vibe/category pages, creator-page
indexation quality gate (noindex storefronts with zero claimed designs — thin pages
drag the whole domain), CWV pass on the hero video.

**Phase 4 (months 7–12) — authority.** Creator-story content, PR around the royalty
model, ImageObject schema on designs.

## Meta variants (homepage)

Shipped: benefit-lead variant, in [app/layout.tsx](../app/layout.tsx).

| # | Mechanic | Description | Chars |
|---|---|---|---|
| V1 ✅ | Benefit lead | Turn one prompt into 1-of-1 AI apparel only you own. Claim your design, launch an instant storefront, and earn royalties on every resale. Start free. | 149 |
| V2 | Question hook | Who owns an AI-generated shirt design? On Shirt Bazaar, you do. Claim a 1-of-1 piece, open your own storefront, and collect resale royalties. | 139 |
| V3 | Specificity | Every Shirt Bazaar design is a true 1-of-1: one prompt, one shirt, one owner. Claim yours, open a storefront, and earn royalties forever. | 136 |

V1 recommended: leads with the outcome, carries the primary keyword in the first half,
ends on a CTA verb.

## Technical status

Shipped:

- `app/sitemap.ts` — real routes only, plus creator storefronts that have at least one
  claimed design.
- `app/robots.ts` — disallows `/api/`, `/dashboard/`, auth routes, `/cart`, `/design/`.
- `metadataBase` + Organization and WebSite JSON-LD in `app/layout.tsx`.
- `generateMetadata` on `/creator/[handle]`, with `noindex` on empty storefronts.
- `getStorefrontData` wrapped in React `cache()` so metadata and body share one query pass.

Still open:

- `NEXT_PUBLIC_SITE_URL` is unset. Until it is, `metadataBase`, canonicals, sitemap URLs,
  and JSON-LD all fall back to `http://localhost:3000`. **Set this before any deploy.**
- `/` is `force-dynamic` — no static/ISR caching for the most-linked page.
- Hero background video is an uncached third-party MP4 (`cdn.jiro.build`); it is the
  LCP-adjacent asset and a cross-origin dependency on someone else's CDN.
- Ten public routes are `<ComingSoon />` stubs. Each one is excluded from the sitemap
  and needs re-adding the day it ships.
- No SearchAction in WebSite schema — `/search` doesn't handle `?q=` yet.
- No Product schema; `/design/[id]` is still a stub.

## Known blockers on trust copy

- `components/home/Hero.tsx` still renders "Trusted by 837k+ creators & fashion
  enthusiasts" as a hardcoded string. Same class of unverifiable claim as the removed
  investor badge. Replace with `getHomeStats()` output or delete.
