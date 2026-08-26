/** Regenerates every raster app icon from the "1/1" mark.
 *
 *  Run: `node scripts/generate-icons.mjs`
 *
 *  The mark lives in three places that cannot import from each other —
 *  components/ui/logo.tsx, app/icon.svg and public/logo-icon.svg — so the
 *  paths are repeated here too. They are the same three strings; change one,
 *  change all four and re-run this.
 *
 *  ponytail: sharp is already a dependency (Next uses it for image
 *  optimisation), so this adds no install. The .ico is written by hand because
 *  the format is a 6-byte header plus 16 bytes per entry, and pulling a
 *  package in for that would be the heavier option.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const INK = "#262626";
const LIME = "#A3E635";

const MARK_PATHS = [
  "M0 0H32V100H8V19H0V0Z",
  "M53 0H74L51 100H30L53 0Z",
  "M80 0H104V100H80V0Z",
];

/** `rounded` is for browser-tab favicons, which are shown exactly as given.
 *  Apple and Android mask the icon themselves, so those get a full-bleed
 *  square — rounding it here would show a dark corner inside their mask. */
function badgeSvg({ size, rounded }) {
  const radius = rounded ? 22 : 0;
  const paths = MARK_PATHS.map((d) => `<path d="${d}"/>`).join("");

  // Optical sizing. At 32px and below there are too few pixels for the three
  // strokes to survive generous padding — the slash closes up against the bars
  // and the mark turns to mush. Small tiles get a larger mark and thinner
  // margin; large tiles keep the roomier lockup that matches app/icon.svg.
  const scale = size <= 32 ? 0.72 : 0.55;
  const x = (100 - 104 * scale) / 2;
  const y = (100 - 100 * scale) / 2;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">` +
      `<rect width="100" height="100" rx="${radius}" fill="${INK}"/>` +
      `<g transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${scale})" fill="${LIME}">${paths}</g>` +
      `</svg>`,
  );
}

/** `density` controls how finely sharp rasterises the SVG, and it overrides the
 *  SVG's own width/height — at density 384 a 16px SVG comes out 85px. So it is
 *  deliberately rendered large for clean edges and then resized down to the
 *  exact pixel target, which is the size the file actually has to be. */
const png = (size, rounded) =>
  sharp(badgeSvg({ size, rounded }), { density: 384 })
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();

/** ICO: 6-byte header, then one 16-byte directory entry per image, then the
 *  PNG payloads. Embedding PNG rather than BMP is allowed and is what every
 *  modern generator emits. A 0 byte in the size field means 256. */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const targets = [
  { file: "public/favicon-16x16.png", size: 16, rounded: true },
  { file: "public/favicon-32x32.png", size: 32, rounded: true },
  { file: "public/apple-touch-icon.png", size: 180, rounded: false },
  { file: "public/android-chrome-192x192.png", size: 192, rounded: false },
  { file: "public/android-chrome-512x512.png", size: 512, rounded: false },
];

for (const { file, size, rounded } of targets) {
  writeFileSync(join(root, file), await png(size, rounded));
  console.log(`wrote ${file} (${size}px)`);
}

const icoSizes = [16, 32, 48];
const icoImages = [];
for (const size of icoSizes) {
  icoImages.push({ size, data: await png(size, true) });
}
writeFileSync(join(root, "public/favicon.ico"), buildIco(icoImages));
console.log(`wrote public/favicon.ico (${icoSizes.join(", ")}px)`);
