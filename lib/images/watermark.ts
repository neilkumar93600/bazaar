import sharp from "sharp";

/** Burns a tiled watermark into the artwork before it leaves the server.
 *
 *  The point is not to stop a screenshot — nothing can. Any pixel a browser
 *  renders can be captured. The point is that the captured file is already
 *  marked and already too small to print, so taking it gains nothing.
 *
 *  Two decisions worth knowing:
 *
 *  - The tile is the "1/1" mark drawn as vector paths, not text. Text in an
 *    SVG composite depends on whatever fonts the runtime happens to have, and
 *    a serverless container usually has almost none — the watermark would
 *    silently render as blank boxes or vanish. Paths always draw.
 *  - Each tile is painted twice, dark first and light offset over it. A single
 *    tone disappears on artwork that happens to match it, and these are
 *    full-bleed AI images that can be any tone at all.
 */

// The same three paths as components/ui/logo.tsx, on a 104x100 grid.
const MARK_PATHS = [
  "M0 0H32V100H8V19H0V0Z",
  "M53 0H74L51 100H30L53 0Z",
  "M80 0H104V100H80V0Z",
];

const MARK_W = 104;
const MARK_H = 100;

export type WatermarkOptions = {
  /** Width of one mark in the tile. Scales with the image so the watermark
   *  stays proportionate rather than turning into confetti on a large render. */
  markWidth?: number;
  /** 0..1. Low enough to read the art through, high enough to survive a
   *  contrast pass. */
  opacity?: number;
};

/** The overlay, as an SVG buffer sized to the image. Pure — no I/O — so the
 *  tiling maths can be checked without rendering anything. */
export function watermarkSvg(
  width: number,
  height: number,
  { markWidth, opacity = 0.16 }: WatermarkOptions = {},
): Buffer {
  // Clamp rather than trust: opacity comes from a caller, and a value above 1
  // paints an opaque sheet over the artwork.
  const alpha = Math.min(Math.max(opacity, 0), 1);

  // Proportional to the image, with a floor so a thumbnail still carries a
  // legible mark rather than a smudge.
  const mw = markWidth ?? Math.max(28, Math.round(Math.min(width, height) * 0.11));
  const scale = mw / MARK_W;
  const mh = MARK_H * scale;

  // Generous gaps: a dense grid destroys the artwork, and the goal is a file
  // nobody wants to pass off as their own, not an unviewable one.
  const tileW = Math.round(mw * 3.1);
  const tileH = Math.round(mh * 2.6);

  const paths = MARK_PATHS.map((d) => `<path d="${d}"/>`).join("");
  const group = (dx: number, dy: number, fill: string, a: number) =>
    `<g transform="translate(${dx} ${dy}) scale(${scale.toFixed(4)})" fill="${fill}" fill-opacity="${a.toFixed(3)}">${paths}</g>`;

  // The diagonal matters: an upright watermark is far easier to clone out or
  // crop around than one crossing the subject at an angle.
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs><pattern id="wm" width="${tileW}" height="${tileH}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">` +
      // Dark under, light over: whichever the artwork matches, the other shows.
      group(1.5, 1.5, "#000000", alpha * 0.75) +
      group(0, 0, "#ffffff", alpha) +
      `</pattern></defs>` +
      `<rect width="${width}" height="${height}" fill="url(#wm)"/>` +
      `</svg>`,
  );
}

export type PreviewOptions = WatermarkOptions & {
  /** Longest edge of the returned image. The real protection: a marked image
   *  at preview size cannot be sent to a printer. */
  maxEdge?: number;
};

/** Downscaled, watermarked WebP for anyone who does not own the design. */
export async function watermarkedPreview(
  input: Buffer,
  { maxEdge = 900, ...options }: PreviewOptions = {},
): Promise<Buffer> {
  // `withoutEnlargement` so a small source is never upscaled into a blurry
  // preview just to hit the ceiling.
  const resized = sharp(input)
    .rotate()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true });

  const { width, height } = await resized.toBuffer({ resolveWithObject: true }).then(
    ({ info }) => info,
  );

  return sharp(await resized.toBuffer())
    .composite([{ input: watermarkSvg(width, height, options), top: 0, left: 0 }])
    // Metadata is dropped by default here, which also strips any prompt or
    // generator fields the upstream image may carry in EXIF.
    .webp({ quality: 82 })
    .toBuffer();
}
