# Persona as design DNA — structural blueprint, render-only styles, single-paragraph prompts

Date: 2026-08-27
Status: draft, awaiting review

Supersedes the persona built in `2026-08-09-create-v2-design.md` sub-project C.
That persona is a soft brand-voice sentence subordinate to the style. This one
inverts the relationship.

## Problem

Three things feed prompt generation — **enhance**, **style**, **persona** — and
they are not orthogonal.

**Persona is inert.** `personaVoice` has exactly one consumer in the codebase:
`promptSystemPrompt()` in `lib/generation/compose.ts:292`. That is called only
from `askPromptDirection()`, which is called only when `enhance === true`
(`compose.ts:370`). A maker who turns enhance off and picks a persona gets a
prompt byte-identical to one with no persona at all. Silent.

Where it does run, it is told to lose: *"Brand voice: … it never overrides the
style above"* (`compose.ts:306`). Against a genre preset it is near-inert.

**Style carries structure it should not own.** `StylePreset.family` decides
whether letterforms are allowed, `composition` sets the layout, `fullBleed`
decides whether background removal runs. Those are structural properties of a
design, not of a rendering technique, and a maker who wants their layout to
survive a style change has no way to say so.

**The prompts themselves are off-corpus.** Measured against the 162-prompt
Reference Gallery in `.claude/skills/gpt-image/references/`:

| | corpus | `buildPrompt()` output |
| --- | --- | --- |
| blocks (blank-line separated) | 79% are one block | 5–7 |
| words | p25 95 · median 128 · p75 138 · p90 169 | 166–248 |
| terminal negative list | 30% have one | 100% |
| boilerplate constraint share | — | 32–40% of every prompt |

The one gallery category that fragments into labelled blocks is
`research-paper-figures` (19% single-block) — the least shirt-like content in
the atlas. Every category that resembles a shirt graphic is 100% single-block:
`more-illustration-styles`, `fine-art-painting`, `isometric`,
`brand-systems-and-identity`, `character-design`, `illustration`, `watercolor`,
`pixel-art`, `retro-and-cyberpunk`.

## Scope

The persona subsystem end to end: extraction from references, storage,
sampling, and prompt compilation. Plus the two things split-domains forces:
`StylePreset` collapsing to a render mode, and `buildPrompt` gaining a
single-paragraph persona path.

Out of scope, deferred:

- **Blueprint editing.** v1 shows a read-only card. An unhappy maker deletes and
  re-uploads a tighter reference set.
- **Reference images passed to the image model.** Text-only. Feeding uploaded
  third-party designs into every render conflicts with the 100% IP ownership
  positioning.
- **Sub-persona clustering.** One blueprint per persona.
- **Storage sweep** for orphaned reference images. Pre-existing gap.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Persona vs style precedence | Split domains — they never speak about the same thing | Orthogonal axes cannot contradict, so no precedence rule is needed at all |
| Blueprint representation | Fully typed enums, fine-grained vocabularies | Validatable, samplable, renderable as a read-only card. Coarse buckets would collapse the DNA, so vocabularies run 5–10 values per axis |
| Variance | Every axis stores weighted distributions, sampled per design | Falls out of comparing references. A persona is a probability space, not a stencil |
| Built-in personas | None | A persona is derived from a maker's own references or it does not exist |
| Enforcement | Compiled into `prompt.ts`, not into Kimi's system prompt | Same tier as the backdrop and the letterform ban. A model paraphrasing structure is the documented failure mode that returns blank PNGs |
| Prompt shape | One paragraph, ~95–140 words, no labels | 79% of corpus, 100% of shirt-relevant categories |
| Style scope | Render technique only, 10 modes | Split-domains leaves nothing else for a style to own |
| Palette owner | Persona | Extracted from references, per the original brief. A render mode has no palette |
| `cutField` | Derived from persona palette luminance | Was hand-authored per preset with a test to enforce it. Now computable |
| `vibeSlug` | Deleted; Kimi classifies the idea into one of the 6 existing vibes | Vibes are the browse taxonomy (38 files), not a style property. Folds into the listing call already being made — no extra request |
| Reference count | 5 minimum, 20 maximum | Was 20–50 |
| Emission | Axes at their neutral value stay silent | At a 130-word budget, 18 axes each spending a clause starves the subject, where scene density lives |

## Architecture

Three inputs, one job each, no overlap.

| Knob | Owns | Runs when |
| --- | --- | --- |
| Persona | composition, placement, scale, negative space, hierarchy, typography, graphic character, print treatment, ink count, palette, contrast, mood | always, when one is selected |
| Style | render technique | always |
| Enhance | subject, materials, lighting — density only | only when on |

### Files

| File | Change |
| --- | --- |
| `lib/generation/blueprint.ts` | **new.** Type, enum vocabularies, phrase lexicon, `sampleBlueprint()`, neutral-value table |
| `lib/generation/blueprint-analysis.ts` | **new.** Vision call returning typed JSON. Replaces `persona-analysis.ts` |
| `lib/generation/persona-prompt.ts` | **new.** `buildPersonaPrompt()` — single-paragraph compiler |
| `lib/generation/prompt.ts` | Extract shared fragments. `buildPrompt()` unchanged on the no-persona path |
| `lib/generation/styles.ts` | 764 → ~60 lines. `StylePreset` becomes `{ slug, label, hint, render }` |
| `lib/generation/personas.ts` | Delete `PERSONA_PRESETS` and `voice`. Keep `savedPersonaValue` / `savedPersonaId` |
| `lib/generation/persona-analysis.ts` | Delete |
| `lib/generation/compose.ts` | `promptSystemPrompt` takes a sampled blueprint; Kimi confined to subject/materials/lighting. Add `vibe` to the listing call. Delete `namesAPalette` |
| `lib/data/personas.ts` | `styleSummary` → `blueprint` |
| `app/api/generate/route.ts` | Resolve blueprint not voice; vibe from Kimi not from style |
| `components/create/StylePicker.tsx` | Flat list of 10, no family grouping |
| `components/dashboard/PersonaManager.tsx` | Read-only blueprint card |
| `supabase/migrations/…_persona_blueprint.sql` | **new.** `blueprint jsonb`, drop `style_summary` |

### Data flow

```
5–20 refs ──► blueprint-analysis (vision, typed JSON)
                    │
                    ▼
            personas.blueprint  (weighted distributions)
                    │
   generate ────────┤
                    ▼
            sampleBlueprint()  ──►  one concrete value per axis
                    │
      style.render ─┼─ idea ─┬─ enhance? ──► Kimi: subject/materials/lighting
                    │        │
                    ▼        ▼
            buildPersonaPrompt()  ──►  one paragraph, ~95–140 words
```

## The blueprint

`Weighted<T> = { value: T; weight: number }`, weights summing to 1. A locked
axis is `[{ value: x, weight: 1 }]` — no separate lock concept.

### Structure — code branches on these

| Axis | Vocabulary |
| --- | --- |
| `carriesText` | `none` · `primary` · `paired` |
| `plate` | `isolated` · `fullbleed` |
| `layout` | `centered` · `asymmetric-chest` · `stacked` · `oversized-bleed` · `small-chest-mark` · `arched-broadside` · `split-horizontal` |
| `scale` | `chest-mark` · `small` · `medium` · `large` · `oversized` |
| `negativeSpace` | `tight` · `balanced` · `generous` · `extreme` |
| `inkCount` | `1`–`5` |

`carriesText` replaces `StyleFamily` as the prompt branch selector. `plate`
replaces `fullBleed`: `fullbleed` skips background removal and pins the garment
colour.

### Typography — read only when `carriesText !== "none"`

| Axis | Vocabulary |
| --- | --- |
| `typeface` | `condensed-grotesk` · `wide-grotesk` · `geometric-sans` · `transitional-serif` · `slab` · `blackletter` · `script` · `display-decorative` · `monospace` · `hand-drawn` |
| `weight` | `light` · `regular` · `medium` · `bold` · `black` |
| `tracking` | `very-tight` · `tight` · `normal` · `loose` · `very-loose` |
| `caseStyle` | `all-caps` · `title` · `lower` · `mixed` |
| `typeSet` | `single-line` · `two-line-stack` · `three-line-stack` · `arched` · `vertical` · `wordmark-block` |

### Graphics, print and colour

| Axis | Vocabulary |
| --- | --- |
| `graphicKind` | `none` · `geometric-mark` · `line-illustration` · `solid-silhouette` · `detailed-illustration` · `photographic-collage` · `texture-field` |
| `strokeStyle` | `hairline` · `uniform-medium` · `heavy` · `variable-brush` · `fill-only` |
| `printStyle` | `clean-vector` · `distressed` · `halftone` · `riso-offset` · `screen-print-texture` · `embroidery-like` · `airbrush` |
| `contrast` | `low` · `medium` · `high` · `extreme` |
| `hierarchy` | `type-first` · `graphic-first` · `equal-weight` |
| `palette` | free-form hex + name pairs, weighted. The one non-enum axis: colour is continuous |
| `mood` | one clamped sentence. Inherits what the old `voice` was reaching for |

## Styles

`StylePreset` becomes `{ slug, label, hint, render }`.

| slug | label | render anchor |
| --- | --- | --- |
| `default` | Default | rendered true to the idea rather than any one technique |
| `realistic` | Realistic | photorealistic rendering flattened to print separations, accurate proportion and material |
| `anime` | Anime | cel-shaded anime rendering, crisp line art, flat two-tone shadows |
| `ghibli` | Ghibli-esque | soft painterly anime, gouache-like fills, warm hand-painted light |
| `3d` | 3D Render | dimensional forms with studio lighting and soft occlusion, flattened for print |
| `illustration` | Illustration | hand-drawn painterly illustration, visible brush and pencil character |
| `vector` | Vector / Flat | clean geometric vector shapes, flat fills, hard edges |
| `line` | Line Art | pure linework, minimal fill, confident consistent weight |
| `vintage-print` | Vintage Print | riso and halftone character, dot texture, slight misregistration, aged ink |
| `pixel` | Pixel | low-resolution pixel rendering, limited dither, hard aliased edges |

There is no `typo` mode. Persona owns every typographic property, so a `typo`
style would be a render mode with no render content. Type is drawn by whichever
mode is selected — `3d` plus `carriesText: primary` is dimensional lettering,
`vintage-print` plus primary is distressed type.

## Prompt compilation

Slot order, welded with commas into one paragraph. A slot whose axis sits at
its neutral value emits nothing.

```
imperative + style render anchor + artifact + aspect
subject (Kimi, or the raw idea)
materials, lighting (Kimi only)
graphic character + stroke
placement + scale + negative space
[typography: quoted literal, spelled out, face/weight/case/tracking/set,
 hierarchy, legibility]
print treatment + ink count + palette
ground field
mood
terminal avoid list, 3–5 targeted items
```

### Neutral values

An axis at its neutral value emits nothing. Neutral is the value gpt-image-2
already defaults to, so naming it spends words to change nothing:

| Axis | Neutral |
| --- | --- |
| `layout` | `centered` |
| `scale` | `medium` |
| `negativeSpace` | `balanced` |
| `contrast` | `medium` |
| `hierarchy` | `equal-weight` |
| `weight` | `regular` |
| `tracking` | `normal` |
| `caseStyle` | `mixed` |
| `typeSet` | `single-line` |
| `strokeStyle` | `uniform-medium` |
| `graphicKind` | `none` (emits nothing either way) |

`carriesText`, `plate`, `inkCount`, `printStyle`, `typeface`, `palette` and
`mood` have no neutral — each always emits, because each always changes the
image.

Sample — `anime` render, streetwear-derived persona, enhance on, 118 words:

> Create a cel-shaded anime rendering as flat screen-print artwork for the front
> of a t-shirt, 3:4 portrait, a brass-helmeted deep sea diver with cracked
> porthole glass, barnacle crust, kelp fronds threaded through the air valve, a
> frayed canvas suit and corroded rivets, pitted brass and salt-bloomed canvas,
> hard rim light from the upper left with deep falloff, set small and off-centre
> toward the chest-left with generous negative space breathing around it, crisp
> line art with flat two-tone shadows, screen-printable flat spot separations in
> a single sky-cyan ink, hard edges, high contrast, on one flat solid pure black
> field edge to edge. Avoid gradients inside a fill, drop shadows, any lettering,
> photographic realism, and anything rendered in pure black.

Same persona, style swapped to `vintage-print` — two clauses move, structure
holds:

> Create a riso and halftone rendering as flat screen-print artwork … *set small
> and off-centre toward the chest-left with generous negative space breathing
> around it*, **dot texture with slight misregistration and aged ink**,
> screen-printable separations in a single **rust-orange** ink …

### Defects fixed en route

| | Defect | Fix |
| --- | --- | --- |
| F1 | Typographic branch drops the raw idea unlabelled mid-sentence — `Palette of molten orange, bone white. gym motivation. Flat spot-colour…` (`prompt.ts:248`) | No prose slot exists for a bare idea to fall into |
| F2 | Negatives are 32–40% of every prompt; corpus says short and targeted | 3–5 terminal items |
| F3 | Constraints glued into the tail of Art direction | Terminal sentence of its own |
| F4 | Enhance off with a 2-word idea ships `Subject: a moth` | **Open — see below** |
| F5 | `colours drawn from the subject and materials above` when no materials line was emitted | Persona owns the palette; the sentence is never conditional |
| F6 | Typographic branch has no legibility or hierarchy language | Both are persona axes and always emit |
| M1 | Persona inert when enhance is off | Blueprint compiles in `prompt.ts`, independent of Kimi |

## Interaction matrix

Eight combinations of enhance × style × persona.

| E | S | P | Result |
| --- | --- | --- | --- |
| off | default | none | unchanged from today — no persona, no promises |
| off | mode | none | unchanged |
| off | default | saved | **fixed.** Full blueprint, raw idea as subject. Correct structure with zero model calls |
| off | mode | saved | **fixed.** Blueprint structure, chosen render |
| on | default | none | unchanged |
| on | mode | none | unchanged |
| on | default | saved | Blueprint structure, Kimi densifies the subject, palette from persona |
| on | mode | saved | **the target.** Structure, render and density each from their own knob |

## Error handling

| Failure | Behaviour |
| --- | --- |
| Vision call fails or times out | `{ error }` returned to the maker. Same as today — this is a button press, not a background job |
| Vision returns an unknown enum value | Drop that axis, keep the rest. A partial blueprint is usable; a rejected one wastes the upload |
| Vision returns no usable axis at all | `{ error }`. Nothing to save |
| Weights do not sum to 1 | Normalise on read. Never reject |
| Kimi fails with a persona present | Blueprint still compiles; the raw idea becomes the subject. Degrades to the enhance-off row |
| Kimi returns an unknown vibe slug | Fall back to `dusk-atelier`. A design that cannot be filed is worse than one filed loosely |

## Testing

Node's `assert` via `npx tsx`, matching the existing suite in `package.json`.

- `blueprint.test.ts` — sampling honours weights over many draws; a
  single-value axis always returns it; malformed weights normalise; unknown
  enums are dropped
- `persona-prompt.test.ts` — output is one block; word count inside 90–150;
  every literal string survives verbatim and spelled out; neutral axes emit
  nothing; the same blueprint across two render modes differs only in the render
  and palette clauses
- `styles.test.ts` — rewritten for 10 render modes; the `cutField` invariant
  moves to blueprint palette luminance
- `prompt.test.ts` — unchanged, guarding the no-persona path against regression

## Phasing

Large for one plan. Three stages, each shippable and independently revertable:

1. **Styles collapse.** 37 presets → 10 render modes, `vibeSlug` deleted, Kimi
   classifies the vibe. Touches `styles.ts`, `StylePicker`, `route.ts`,
   `compose.ts`, both style tests. No persona work, no migration. The riskiest
   stage — it moves the browse taxonomy off a hand-maintained map.
2. **Blueprint extraction and storage.** `blueprint.ts`,
   `blueprint-analysis.ts`, the migration, the read-only card. Nothing reads the
   blueprint at generation time yet, so it cannot break a render.
3. **Prompt compilation.** `persona-prompt.ts`, fragment extraction from
   `prompt.ts`, wiring in `route.ts` and `compose.ts`. The stage that changes
   what makers actually get.

## Open questions

1. **F4 density floor.** Enhance off plus an idea under ~5 words renders at 85
   words, below the corpus p25 of 95. Force the Kimi call under a word
   threshold, or let thin ideas render thin?
2. **Scope of the F1–F6 fixes.** They are live defects on the no-persona path
   too. Fix `buildPrompt()` in the same pass, or leave it and only build the new
   path correctly?
3. **Migration of existing personas.** `reference_image_urls` is already stored,
   so a backfill can re-analyse without re-upload. Backfill, or let makers
   re-create?
