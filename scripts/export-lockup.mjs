/** Exports the full "1/1 SHIRT BAZAAR" lockup as PNGs, for use off the site.
 *
 *  Run: `node scripts/export-lockup.mjs`  →  writes to `export/logo/`
 *
 *  WHY NOT sharp, like scripts/export-logo.mjs. The wordmark is Geist 900,
 *  which reaches the site through `next/font/google` and exists nowhere on
 *  disk. sharp rasterises SVG through the OS font list, so a `<text>` element
 *  asking for Geist silently falls back to whatever Windows or Linux happens
 *  to have and ships a wrong logo that looks plausible. Verified: it rendered
 *  without complaint in a fallback face.
 *
 *  WHAT RUNS INSTEAD. `@vercel/og` — already on disk because Next bundles it —
 *  wraps satori, which lays out text using a font buffer you hand it, and
 *  resvg, which rasterises the result. Geist 900 is fetched from Google Fonts
 *  as a real TTF and cached, so the wordmark is set in the actual face.
 *
 *  The bundled copy is imported by file path. Its package `exports` map is not
 *  reachable as `next/dist/compiled/@vercel/og` (directory import), and
 *  `@vercel/og` is not a direct dependency.
 *
 *  PROPORTIONS come from the live component, scaled 10x. components/ui/logo.tsx
 *  sets the icon `w-[21px] h-[20px]`, the wordmark `text-lg font-black
 *  tracking-tight uppercase`, and the gap `gap-2.5` — so 20px mark, 18px type,
 *  10px gap becomes 200 / 180 / 100 here.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "export", "logo");
const cacheDir = join(root, "export", ".fonts");
const fontFile = join(cacheDir, "Geist-900.ttf");

// pathToFileURL, not the bare path: on Windows a dynamic import of `e:\...`
// is rejected as an unsupported URL scheme.
const { ImageResponse } = await import(
  pathToFileURL(
    join(root, "node_modules/next/dist/compiled/@vercel/og/index.node.js"),
  ).href
);

const INK = "#262626";
const LIME = "#A3E635";
const PAPER = "#FFFFFF";

const MARK_PATHS = [
  "M0 0H32V100H8V19H0V0Z",
  "M53 0H74L51 100H30L53 0Z",
  "M80 0H104V100H80V0Z",
];

/** satori has no `<svg>` element, so the mark goes in as an <img> holding a
 *  data-URI SVG. Base64 rather than percent-encoding: the `#` in a hex fill
 *  terminates a data URI otherwise. */
function markDataUri(fill) {
  const paths = MARK_PATHS.map((d) => `<path d="${d}" fill="${fill}"/>`).join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 100">${paths}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Google serves woff2 to modern UA strings and TTF to old ones. satori needs
 *  TTF/OTF, so the request deliberately claims to be an ancient browser. */
async function geist900() {
  if (existsSync(fontFile)) return readFileSync(fontFile);

  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Geist:wght@900&display=swap",
    { headers: { "User-Agent": "Mozilla/4.0" } },
  ).then((r) => r.text());

  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error("no TTF url in Google Fonts CSS for Geist 900");

  const ttf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(fontFile, ttf);
  return ttf;
}

const MARK_H = 200;
const MARK_W = Math.round((MARK_H * 104) / 100);
const TYPE = 180;
const GAP = 100;
const PAD = 80;

const el = (type, props) => ({ type, props });

function lockup({ markFill, textFill, ground, stacked }) {
  const mark = el("img", {
    src: markDataUri(markFill),
    width: MARK_W,
    height: MARK_H,
  });

  const word = el("div", {
    style: {
      fontFamily: "Geist",
      fontSize: TYPE,
      fontWeight: 900,
      color: textFill,
      letterSpacing: "-0.025em",
      lineHeight: 1,
      // satori does not implement text-transform; the string is already caps.
      whiteSpace: "nowrap",
    },
    children: "SHIRT BAZAAR",
  });

  return el("div", {
    style: {
      display: "flex",
      flexDirection: stacked ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: stacked ? GAP * 0.6 : GAP,
      padding: PAD,
      width: "100%",
      height: "100%",
      // Omitted entirely when null — a transparent root is what resvg needs to
      // leave the alpha channel alone.
      ...(ground ? { background: ground } : {}),
    },
    children: [mark, word],
  });
}

const font = await geist900();

/** Horizontal lockup runs about 6.2 mark-widths wide once the wordmark is set;
 *  the box is sized generously and satori centres inside it. */
const targets = [
  {
    file: "lockup-ink.png",
    w: 2400,
    h: 400,
    node: lockup({ markFill: INK, textFill: INK, ground: null, stacked: false }),
  },
  {
    file: "lockup-white.png",
    w: 2400,
    h: 400,
    node: lockup({ markFill: PAPER, textFill: PAPER, ground: null, stacked: false }),
  },
  {
    file: "lockup-lime-on-ink.png",
    w: 2400,
    h: 400,
    node: lockup({ markFill: LIME, textFill: PAPER, ground: INK, stacked: false }),
  },
  {
    file: "lockup-ink-on-paper.png",
    w: 2400,
    h: 400,
    node: lockup({ markFill: INK, textFill: INK, ground: PAPER, stacked: false }),
  },
  {
    file: "lockup-stacked-ink.png",
    w: 1600,
    h: 700,
    node: lockup({ markFill: INK, textFill: INK, ground: null, stacked: true }),
  },
  {
    file: "lockup-stacked-lime-on-ink.png",
    w: 1600,
    h: 700,
    node: lockup({ markFill: LIME, textFill: PAPER, ground: INK, stacked: true }),
  },
];

mkdirSync(outDir, { recursive: true });

for (const { file, w, h, node } of targets) {
  const res = new ImageResponse(node, {
    width: w,
    height: h,
    fonts: [{ name: "Geist", data: font, weight: 900, style: "normal" }],
  });

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, file), buf);
  console.log(`wrote export/logo/${file} (${w}x${h})`);
}
