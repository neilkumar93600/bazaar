/** Run: `npx tsx lib/images/watermark.test.ts`
 *
 *  ponytail: assert-based, no framework. This one guards artwork that is the
 *  whole product — a watermark that silently renders as nothing, or a preview
 *  that quietly comes back at full print resolution, is worse than none at all
 *  because the page still looks correct.
 */

import assert from "node:assert/strict"

import sharp from "sharp"

import { watermarkSvg, watermarkedPreview } from "./watermark"

// The overlay is sized to the image and carries the mark as paths, not text —
// a font-dependent watermark renders blank in a container with no fonts.
{
  const svg = watermarkSvg(800, 600).toString()
  assert.match(svg, /width="800"/)
  assert.match(svg, /height="600"/)
  assert.match(svg, /<pattern/, "must tile rather than place one mark")
  assert.match(svg, /rotate\(-30\)/, "diagonal is harder to crop out than upright")
  assert.equal(/<text/.test(svg), false, "no text: fonts are not guaranteed server-side")
  for (const d of ["M0 0H32V100H8V19H0V0Z", "M53 0H74L51 100H30L53 0Z", "M80 0H104V100H80V0Z"]) {
    assert.ok(svg.includes(d), "watermark must carry the real mark geometry")
  }
  // Painted twice so it survives on both light and dark artwork.
  assert.ok(svg.includes('fill="#000000"') && svg.includes('fill="#ffffff"'))
}

// Opacity is clamped: a caller passing 5 would otherwise paint an opaque sheet
// over the artwork and ship a page of solid rectangles.
{
  const over = watermarkSvg(400, 400, { opacity: 5 }).toString()
  const alphas = [...over.matchAll(/fill-opacity="([\d.]+)"/g)].map((m) => Number(m[1]))
  assert.ok(alphas.length > 0)
  assert.ok(Math.max(...alphas) <= 1, "opacity must clamp to 1")

  const under = watermarkSvg(400, 400, { opacity: -3 }).toString()
  const lows = [...under.matchAll(/fill-opacity="([\d.]+)"/g)].map((m) => Number(m[1]))
  assert.ok(Math.min(...lows) >= 0, "opacity must clamp to 0")
}

// A large source must come back capped — this is the part that makes a stolen
// file useless for printing.
{
  const source = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: "#c8c8c8" },
  })
    .png()
    .toBuffer()

  const preview = await watermarkedPreview(source, { maxEdge: 900 })
  const meta = await sharp(preview).metadata()

  assert.equal(meta.format, "webp")
  assert.ok(
    Math.max(meta.width ?? 0, meta.height ?? 0) <= 900,
    `longest edge must be capped, got ${meta.width}x${meta.height}`,
  )
  assert.equal(meta.width, 900, "3000x2000 fits to 900x600")
  assert.equal(meta.height, 600)

  // The watermark must actually alter pixels. A flat grey source composited
  // with a no-op overlay would come back flat; real marks create variance.
  const stats = await sharp(preview).stats()
  const spread = stats.channels[0].max - stats.channels[0].min
  assert.ok(spread > 20, `watermark left no visible mark (spread ${spread})`)
}

// A source smaller than the ceiling must not be upscaled into a blurry preview.
{
  const small = await sharp({
    create: { width: 320, height: 240, channels: 3, background: "#404040" },
  })
    .png()
    .toBuffer()

  const preview = await watermarkedPreview(small, { maxEdge: 900 })
  const meta = await sharp(preview).metadata()
  assert.equal(meta.width, 320, "must not enlarge a small source")
  assert.equal(meta.height, 240)
}

console.log("watermark.test.ts OK")
