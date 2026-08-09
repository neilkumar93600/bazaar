/** Where the artwork lands on the garment.
 *
 *  x/y are fractions of the print area and `scale` is a fraction of its width,
 *  so scale 1 fills the area edge to edge.
 *
 *  Its own module, not a private function inside products.ts, so the `both`
 *  rule below can be tested: reversing it is a plausible-looking one-line diff
 *  with an expensive physical consequence.
 */

export type Placement = "front" | "back" | "both"

export const PLACEMENTS: Placement[] = ["front", "back", "both"]

export const PLACEMENT_LABELS: Record<Placement, string> = {
  front: "Front",
  back: "Back",
  both: "Front & back",
}

/** The chest mark on a two-sided print.
 *
 *  Centred-high rather than left-chest: the generator produces 3:4 portrait
 *  illustrations, and shrinking one into a left-chest corner loses every bit of
 *  its detail and reads as a mistake. At 32%, centred just below the collar, it
 *  reads as intentional. */
export const FRONT_MARK_SCALE = 0.32
const FRONT_MARK_Y = 0.28

type Image = { id: string; x: number; y: number; scale: number; angle: number }
type Placeholder = { position: string; images: Image[] }

const full = (id: string): Image => ({ id, x: 0.5, y: 0.5, scale: 1, angle: 0 })

const mark = (id: string): Image => ({
  id,
  x: 0.5,
  y: FRONT_MARK_Y,
  scale: FRONT_MARK_SCALE,
  angle: 0,
})

export function printAreas(
  imageId: string,
  variantIds: number[],
  placement: Placement
): { variant_ids: number[]; placeholders: Placeholder[] }[] {
  const placeholders: Placeholder[] =
    placement === "front"
      ? [{ position: "front", images: [full(imageId)] }]
      : placement === "back"
        ? [{ position: "back", images: [full(imageId)] }]
        : [
            // Small mark front, full art back — the classic two-sided layout.
            { position: "front", images: [mark(imageId)] },
            { position: "back", images: [full(imageId)] },
          ]

  return [{ variant_ids: variantIds, placeholders }]
}
