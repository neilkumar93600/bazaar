# Hero background — image generation brief

For [GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill).

Written against that skill's own conventions rather than freehand. Routing per its
gallery index: this is **isoline / survey-plate** work, so the nearest cases are
`gallery-technical-illustration.md` (No. 112–116, measured linework and callout
discipline) and `gallery-data-visualization.md` (No. 107–111, isoline and chart
grammar). Note those data-viz cases are all label-heavy — this brief inverts that
and negates labels explicitly, which is the one place it departs from its
neighbours. Rules applied from `references/craft.md`:

| Rule | How it shows up below |
|---|---|
| §2 canvas and layout **before** subject | every prompt opens with format, then space allocation, then subject |
| §9 scene density beats adjectives | concrete nouns and a named rendering mechanic, no "stunning"/"beautiful" |
| §10 style anchors specific and bounded | USGS quadrangle and Ordnance Survey draughtsmanship, not "map style" |
| §12 material / lighting / palette are separate controls | line, palette, depth and paper are four separate clauses |
| §14 negation only for strong priors | the avoid-line targets what a topographic prompt actually defaults to: terrain, outlines, elevation numbers, legends |
| §1 exact text in quotes | there is no text, so it's negated — survey plates prior hard toward spot heights and grid labels |

## Why the hero art is changing

`docs/DESIGN.md` (Brainfish) is explicit: *"Illustration and product UI, not
photography… No lifestyle photography, no 3D render, no decorative gradient other
than the lime radial halo."* The current hero is market-stall footage — the last
surface contradicting its own style reference. This keeps the bazaar as subject
and changes the medium to contour draughtsmanship on paper.

The style is the reference's own signature asset turned onto the product: Brainfish
runs a topographic contour watermark beneath its sections, so drawing the garments
*as* contour maps ties the hero to the system rather than merely matching its
palette.

## Render two sizes, not one

The hero frame is full-width and `100dvh`, so its aspect flips: ~16:9 on desktop,
~4:9 on a phone. One landscape render `object-cover`'d on mobile crops to the
middle third and throws away the vanishing point the composition is built on. The
empty space also has to **move** — beside the headline on desktop, above it on
mobile.

| File | Size flag | Pixels | Used at |
|---|---|---|---|
| `public/bazaar/hero-ink-wide.png` | `--size landscape` | 1536×1024 | `md` and up |
| `public/bazaar/hero-ink-tall.png` | `--size 1024x1792` | 1024×1792 | below `md` |

`--size` takes literal pixels in 16px multiples (max 3840 edge), so the tall one
is 4:7 rather than the stock 2:3 `portrait` — much closer to the real phone frame.

## Prompt — wide

```text
Create a horizontal 16:9 survey-plate illustration on warm paper white, composed with the left 40% of the canvas as unmarked empty paper (deliberate negative space reserved for headline type) and all detail massed in the right 60%. Subject: six printed t-shirts hanging in a row from a single sagging wire line, small pegs at each shoulder, the line dipping slightly between supports. Rendering mechanic, and this is the whole image: each garment is described ONLY by concentric topographic elevation contours that follow its own folds, sleeves, collar and hem, nested inward like the isolines of a contour map. The outermost contour traces the garment silhouette so the shirts read instantly as shirts, but no garment carries a drawn outline, fill, hatching or shading of any kind. Contour spacing tightens where fabric creases and gathers at the pegs, and opens out across flat chest panels. Line: uniform hairline weight throughout, single dark ink (#262626), no line-weight variation, no tapering. Palette: warm paper-white ground, that one dark ink, plus exactly one garment whose contours are drawn in flat highlighter-lime (#a3e635) — the only colour anywhere in the image. Depth: implied by contour density alone. There is no light source, no cast shadow, no tonal wash. Paper: faint fibre texture, clean and unaged. Aesthetic bound: USGS 7.5-minute quadrangle contour plate and Ordnance Survey isoline draughtsmanship, applied to garments instead of terrain. Avoid mountains, hills, terrain or any landscape reading; avoid drawn outlines around the garments; avoid shading, hatching, stippling or grey wash; avoid elevation numbers, spot heights, map labels, legend, compass rose, scale bar or coordinate grid; avoid all text and numerals; avoid any second colour; avoid a drawn border or frame.
```

```bash
uv run "$SKILL_DIR/scripts/generate.py"   -p "$(cat docs/prompts/hero-ink-wide.txt)"   --size landscape --quality high -n 4   -f public/bazaar/hero-ink-wide.png
```

## Prompt — tall

Not a crop of the wide render. Recomposed vertically, with the reserved paper
moved to the top where the mobile headline sits, and the garments staggered so the
vertical frame has rhythm.

```text
Create a tall 4:7 vertical survey-plate illustration on warm paper white, composed with the top 35% of the canvas as unmarked empty paper (deliberate negative space reserved for headline type) and all detail massed in the lower 65%. Subject: three printed t-shirts hanging at staggered heights from two sagging wire lines that cross the frame horizontally, small pegs at each shoulder, one garment nearer the viewer and larger than the other two. Rendering mechanic, and this is the whole image: each garment is described ONLY by concentric topographic elevation contours that follow its own folds, sleeves, collar and hem, nested inward like the isolines of a contour map. The outermost contour traces the garment silhouette so the shirts read instantly as shirts, but no garment carries a drawn outline, fill, hatching or shading of any kind. Contour spacing tightens where fabric creases and gathers at the pegs, and opens out across flat chest panels. Line: uniform hairline weight throughout, single dark ink (#262626), no line-weight variation, no tapering. Palette: warm paper-white ground, that one dark ink, plus exactly one garment whose contours are drawn in flat highlighter-lime (#a3e635) — the only colour anywhere in the image. Depth: implied by contour density and by the nearer garment overlapping the wire line behind it. There is no light source, no cast shadow, no tonal wash. Paper: faint fibre texture, clean and unaged. Aesthetic bound: USGS 7.5-minute quadrangle contour plate and Ordnance Survey isoline draughtsmanship, applied to garments instead of terrain. Avoid mountains, hills, terrain or any landscape reading; avoid drawn outlines around the garments; avoid shading, hatching, stippling or grey wash; avoid elevation numbers, spot heights, map labels, legend, compass rose, scale bar or coordinate grid; avoid all text and numerals; avoid any second colour; avoid a drawn border or frame.
```

```bash
uv run "$SKILL_DIR/scripts/generate.py"   -p "$(cat docs/prompts/hero-ink-tall.txt)"   --size 1024x1792 --quality high -n 4   -f public/bazaar/hero-ink-tall.png
```

`--quality high` is not optional here: craft.md calls for it on dense linework, and
nested hairline contours are exactly the case that collapses into mush at lower
settings — the whole image is thin closely-spaced line.

## Accepting a render

Re-roll unless all of these hold. `-n 4` is in the commands because these are
pass/fail criteria, not preferences.

- [ ] Lime appears **exactly once**, as a flat fill, on one garment. Two lime
      marks and the accent stops meaning anything — it's the whole discipline of
      the palette.
- [ ] Depth comes from contour spacing only. Any grey wash or hatching means the
      model fell back on conventional shading and the survey-plate conceit is gone.
- [ ] The garments have **no drawn outline**. An outline plus interior contours is
      the most likely failure here, and it collapses the effect into a normal
      illustration with texture inside it.
- [ ] It reads as shirts, not terrain. "Topographic" priors pull hard toward
      mountains; if the silhouettes aren't instantly garments, re-roll.
- [ ] The reserved paper is genuinely empty. Headline text goes there and must
      clear contrast against paper, not against linework.
- [ ] Zero lettering or numerals — no spot heights, no grid references, no legend,
      no compass. Survey-plate priors pull hard toward all four, and generated type
      will be garbled on a site whose entire premise is one-of-one designs.
- [ ] Ink reads near `#262626`, not pure black (`docs/DESIGN.md`: *"Don't use
      #000000 for borders or large fills"*).
- [ ] The vanishing point survives an `object-cover` crop at the target
      breakpoint. Check the tall render at 390×844 and the wide at 1440×900.

## Code changes this forces

The hero assumes a dark photographic background; paper white inverts that.
In `components/home/Hero.tsx`:

1. **Headline and paragraph** — `text-white` / `text-white/85` and their
   `drop-shadow-*` become `text-foreground` / `text-muted-ink`, no shadow. Ink on
   paper needs no scrim.
2. **The bottom-weighted scrim** — the `from-ink/70 via-ink/25` gradient div comes
   out. It exists only to keep white text alive over daylight footage.
3. **The video** — `hero.mp4`, the `useSyncExternalStore` gate, the `poster` and
   the `VIDEO_OK` constant all come out. Also drops ~1.5MB from the critical path.
4. **The nav pill** — `bg-white/60 backdrop-blur-md` was frosting over imagery; on
   paper it flattens to an ink-ruled bar or disappears entirely.
5. **The lime halo** — keep `bg-hero-atmosphere`; it's the one sanctioned gradient
   and still reads over paper. Verify it doesn't sit on top of the render's own
   lime mark.
6. **Art direction** — `<picture>` with `media="(min-width: 768px)"`, or two
   `<Image>`s toggled `hidden md:block`. `priority` stays on whichever renders.
7. **`MenuToggle` / hero form contrast** — both currently sit on `border-ink`
   against video; unchanged on paper, but re-check the mint status pill, which was
   picked to survive a dark backdrop.

Not applied — the asset doesn't exist yet and these edits would leave the hero
mid-swap. Say the word once the PNGs land.
