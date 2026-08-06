import Image from "next/image"

import { cn, hueFromString } from "@/lib/utils"

/** Garment colours, not UI colours — a bone tee is bone in any theme, so these
 *  are literals rather than tokens. Three tones, picked per design, so a wall of
 *  mockups doesn't read as one shirt photocopied fifty times.
 *
 *  `blend` is what stops the print reading as a sticker: the artwork carries its
 *  own background, and multiply drops a pale one into a pale garment while
 *  screen drops a dark one into a dark garment. Where artwork and garment
 *  disagree the print stays a visible panel — which is what that shirt would
 *  actually look like.
 *
 *  `id` names the gradient set this tone renders. Gradients have to be declared
 *  per-document, and a feed mounts dozens of these: keying the ids to the tone
 *  rather than to the instance means at most three distinct definitions on the
 *  page, and the duplicates that browsers resolve to the first match are
 *  identical anyway. */
export const GARMENT_TONES = [
  {
    id: "bone",
    body: "#e9e7e2",
    shade: "#c3bfb6",
    deep: "#a6a199",
    seam: "#b5b0a7",
    blend: "mix-blend-multiply",
  },
  {
    id: "heather",
    body: "#a1a7ac",
    shade: "#7f868c",
    deep: "#666d73",
    seam: "#727980",
    blend: "mix-blend-multiply",
  },
  {
    id: "charcoal",
    body: "#2b2b30",
    shade: "#1c1c20",
    deep: "#121216",
    seam: "#3a3a41",
    blend: "mix-blend-screen",
  },
]

/** Same design, same shirt — every surface that draws this garment resolves it
 *  through here, so a design's colour never changes between views. */
export function garmentToneFor(imageUrl: string) {
  return GARMENT_TONES[hueFromString(imageUrl) % GARMENT_TONES.length]
}

export const VIEWBOX = { width: 100, height: 110 }

/** The chest print, in viewBox units. 2:3, matching the generated artwork, so a
 *  design lands in the print area at its own aspect instead of being letterboxed
 *  inside a square patch. Width is ~68% of the body, which is where a real 12in
 *  print sits on a 20in chest. */
export const PRINT = { x: 31, y: 26, width: 38, height: 57 }

/** The garment outline. Every segment is a curve: a tee has no straight edges —
 *  shoulders slope, sleeve caps round over the arm, the side seam pulls in at
 *  the waist and the hem hangs lower at the front than at the seams. The earlier
 *  polygon read as a paper cut-out for exactly the lack of them. */
const TEE_PATH = [
  "M40,12",
  "C35,12.4 31,12.4 28,13", // left shoulder seam
  "C20,17.5 12,25 7,34", // over the sleeve cap
  "C6.2,36.5 6.8,40 9,45", // round the cuff corner
  "C12,48.5 16.5,50.5 21,51", // sleeve hem
  "C23,48.5 24.8,45.8 26,43", // back up into the armpit
  "C24.6,60 24,84 25,102", // side seam, tapered at the waist
  "C41,104.5 59,104.5 75,102", // hem, hanging low in the middle
  "C76,84 75.4,60 74,43", // right side seam
  "C75.2,45.8 77,48.5 79,51",
  "C83.5,50.5 88,48.5 91,45",
  "C93.2,40 93.8,36.5 93,34",
  "C88,25 80,17.5 72,13",
  "C69,12.4 65,12.4 60,12", // right shoulder seam
  "C58.5,18.5 41.5,18.5 40,12", // collar dip
  "Z",
].join(" ")

const COLLAR_PATH = "M40,12 C41.5,18.5 58.5,18.5 60,12"

/** Where the fabric breaks. Drawn as open strokes rather than filled shapes so
 *  they stay hairlines at any card size. */
const FOLDS = [
  // Kept clear of the print box (x 31–69, y 26–83) on purpose: ink sits on top
  // of the cloth, so a fold line crossing it reads as a scratch on the artwork.
  "M29,60 C30.8,72 30.8,85 29,97",
  "M71,60 C69.2,72 69.2,85 71,97",
  "M30,88 C37,94 45,96 50,96", // the pull across the hem
  "M70,88 C63,94 55,96 50,96",
]

/** A design shown as apparel rather than as flat artwork: a drawn tee blank with
 *  the design printed on the chest.
 *
 *  Drawn, not photographed, on purpose — a photographic blank would need a
 *  matching mockup render per garment tone and per design, and the artwork's own
 *  background would still sit on it as a rectangle. This composites at request
 *  time from the one image the design already has.
 *
 *  Shading is gradients and strokes, never an SVG filter: a filter rasterises
 *  per-pixel per-instance, and the feed puts dozens of these on one screen.
 *
 *  The tee keeps its own 10:11 box and centres inside whatever frame the card
 *  gives it, so the print area's coordinates stay valid at any card aspect. */
export function ShirtMockup({
  imageUrl,
  priority = false,
  className,
}: {
  imageUrl: string
  priority?: boolean
  /** Extra classes for the positioning wrapper, not the tee. */
  className?: string
}) {
  const tone = garmentToneFor(imageUrl)
  const sideId = `tee-side-${tone.id}`
  const chestId = `tee-chest-${tone.id}`
  const contactId = `tee-contact-${tone.id}`

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center p-2",
        className
      )}
    >
      <div className="relative aspect-[10/11] max-h-full w-full">
        <svg
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            {/* The body is a cylinder: dark at both seams, lit down the middle.
                This one gradient does most of the work of making it read as
                cloth with a body inside it rather than as a flat shape. */}
            <linearGradient id={sideId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={tone.deep} stopOpacity="0.85" />
              <stop offset="14%" stopColor={tone.shade} stopOpacity="0.45" />
              <stop offset="38%" stopColor={tone.shade} stopOpacity="0" />
              <stop offset="62%" stopColor={tone.shade} stopOpacity="0" />
              <stop offset="86%" stopColor={tone.shade} stopOpacity="0.45" />
              <stop offset="100%" stopColor={tone.deep} stopOpacity="0.85" />
            </linearGradient>

            {/* Key light on the upper chest, where a garment on a hanger catches
                it. Warm white at low strength — enough to lift, not to glare. */}
            <radialGradient id={chestId} cx="0.5" cy="0.3" r="0.55">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            {/* Contact shadow where the garment meets the surface. A gradient,
                not a blurred ellipse — same look, no filter. */}
            <radialGradient id={contactId} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={tone.deep} stopOpacity="0.32" />
              <stop offset="70%" stopColor={tone.deep} stopOpacity="0.08" />
              <stop offset="100%" stopColor={tone.deep} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="50" cy="103" rx="34" ry="4.5" fill={`url(#${contactId})`} />

          <path d={TEE_PATH} fill={tone.body} />

          {/* Shading passes, painted through the silhouette so none of it can
              spill past the garment's edge. */}
          <path d={TEE_PATH} fill={`url(#${sideId})`} />
          <path d={TEE_PATH} fill={`url(#${chestId})`} />

          {/* Under-sleeve shadow: the arm scoop is the darkest part of a tee
              photographed flat, and its absence is what made the sleeves read as
              wings. */}
          <path
            d="M26,43 C23,45 21.5,48 21,51 C16.5,50.5 12,48.5 9,45 C14,47 20,46 26,43 Z"
            fill={tone.deep}
            opacity="0.35"
          />
          <path
            d="M74,43 C77,45 78.5,48 79,51 C83.5,50.5 88,48.5 91,45 C86,47 80,46 74,43 Z"
            fill={tone.deep}
            opacity="0.35"
          />

          {FOLDS.map((fold) => (
            <path
              key={fold}
              d={fold}
              fill="none"
              stroke={tone.deep}
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.18"
            />
          ))}

          {/* Hem and cuffs, drawn as the double line a folded-and-stitched edge
              actually makes. */}
          <path
            d="M25.6,98.4 C41,100.8 59,100.8 74.4,98.4"
            fill="none"
            stroke={tone.deep}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M10.4,46.6 C13,49 17,50.6 20.6,51.1"
            fill="none"
            stroke={tone.deep}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M89.6,46.6 C87,49 83,50.6 79.4,51.1"
            fill="none"
            stroke={tone.deep}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Collar: a ribbed band, then the shadow it casts into the neck
              opening, then the highlight along its top edge. */}
          <path
            d={COLLAR_PATH}
            fill="none"
            stroke={tone.seam}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M40.6,13.6 C42,19.4 58,19.4 59.4,13.6"
            fill="none"
            stroke={tone.deep}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d={COLLAR_PATH}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.18"
            transform="translate(0,-1.5)"
          />
        </svg>

        {/* Outside the SVG rather than an <image> href, so this stays a
            next/image and keeps its responsive srcset — a feed renders dozens of
            these at once and the source art is 1024×1536. */}
        <div
          className="absolute"
          style={{
            left: `${PRINT.x}%`,
            top: `${(PRINT.y / VIEWBOX.height) * 100}%`,
            width: `${PRINT.width}%`,
            height: `${(PRINT.height / VIEWBOX.height) * 100}%`,
          }}
        >
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 110px, (min-width: 768px) 12vw, 18vw"
            priority={priority}
            className={cn("object-contain", tone.blend)}
          />
          {/* The print has to take the same light as the fabric under it, or it
              floats above the shirt no matter how well the shirt is drawn: the
              chest curves away at both edges, so the ink there is in shadow. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 16%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.05) 84%, rgba(0,0,0,0.22) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  )
}
