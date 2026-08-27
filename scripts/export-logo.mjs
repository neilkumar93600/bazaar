/** Exports the "1/1" mark as standalone PNGs for use outside the website —
 *  decks, print, social profiles, marketplace listings.
 *
 *  Run: `node scripts/export-logo.mjs`  →  writes to `export/logo/`
 *
 *  Distinct from scripts/generate-icons.mjs, which writes the app icons the
 *  site itself serves (favicon, apple-touch, android-chrome) at fixed sizes
 *  into public/. This one writes large transparent artwork nobody's browser
 *  ever requests, so it is a separate script rather than more targets there.
 *
 *  The wordmark lockup is NOT here. "SHIRT BAZAAR" is set in Geist 900, which
 *  arrives via next/font/google and exists nowhere on disk — sharp would
 *  silently fall back to whatever the OS offers and ship a wrong logo. The
 *  lockup is rendered in a real browser instead; see scripts/logo-lockup.html.
 *
 *  ponytail: paths repeated from generate-icons.mjs rather than extracted to a
 *  shared module. That file's own header already documents the mark living in
 *  four places that cannot import from each other; a fifth copy in a sibling
 *  script is cheaper than a module two scripts import for three strings.
 *  Change one, change all five.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "export", "logo");

const INK = "#262626";
const LIME = "#A3E635";
const PAPER = "#FFFFFF";

const MARK_PATHS = [
  "M0 0H32V100H8V19H0V0Z",
  "M53 0H74L51 100H30L53 0Z",
  "M80 0H104V100H80V0Z",
];

const paths = (fill) =>
  MARK_PATHS.map((d) => `<path d="${d}" fill="${fill}"/>`).join("");

/** The bare mark on transparency, at its own 104:100 aspect. For placing on
 *  artwork that already has a ground. */
function markSvg({ width, fill }) {
  const height = Math.round((width * 100) / 104);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 104 100">` +
      paths(fill) +
      `</svg>`,
  );
}

/** The mark as a struck tile — the LogoBadge in components/ui/logo.tsx and the
 *  shape app/icon.svg ships. `bg: null` leaves the tile transparent so the
 *  rounded corner is real transparency rather than a white notch. */
function badgeSvg({ size, bg, fill, radius }) {
  const scale = 0.55;
  const x = (100 - 104 * scale) / 2;
  const y = (100 - 100 * scale) / 2;
  const tile = bg
    ? `<rect width="100" height="100" rx="${radius}" fill="${bg}"/>`
    : "";

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">` +
      tile +
      `<g transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${scale})">${paths(fill)}</g>` +
      `</svg>`,
  );
}

/** density overrides the SVG's own width/height, so render large and resize to
 *  the exact pixel target — same reasoning as generate-icons.mjs. */
const render = (svg, w, h) =>
  sharp(svg, { density: 384 }).resize(w, h, { fit: "cover" }).png().toBuffer();

const SIZE = 2048;
const markH = Math.round((SIZE * 100) / 104);

const targets = [
  // Bare mark, transparent ground.
  { file: "mark-lime.png", svg: markSvg({ width: SIZE, fill: LIME }), w: SIZE, h: markH },
  { file: "mark-ink.png", svg: markSvg({ width: SIZE, fill: INK }), w: SIZE, h: markH },
  { file: "mark-white.png", svg: markSvg({ width: SIZE, fill: PAPER }), w: SIZE, h: markH },

  // Struck tile, rounded — avatars and app surfaces.
  {
    file: "badge-lime-on-ink.png",
    svg: badgeSvg({ size: SIZE, bg: INK, fill: LIME, radius: 22 }),
    w: SIZE,
    h: SIZE,
  },
  {
    file: "badge-ink-on-paper.png",
    svg: badgeSvg({ size: SIZE, bg: PAPER, fill: INK, radius: 22 }),
    w: SIZE,
    h: SIZE,
  },

  // Square tile, no rounding — for surfaces that mask their own corners.
  {
    file: "badge-lime-on-ink-square.png",
    svg: badgeSvg({ size: SIZE, bg: INK, fill: LIME, radius: 0 }),
    w: SIZE,
    h: SIZE,
  },
];

mkdirSync(outDir, { recursive: true });

for (const { file, svg, w, h } of targets) {
  writeFileSync(join(outDir, file), await render(svg, w, h));
  console.log(`wrote export/logo/${file} (${w}x${h})`);
}
