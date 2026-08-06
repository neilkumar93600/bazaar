/** House art direction for every generated design.
 *
 *  The user supplies an idea, never the whole prompt. Raw user text sent
 *  straight to the model drifts hard — within seconds it degenerates into
 *  generic merch covered in garbled pseudo-lettering. Pinning the medium,
 *  palette and composition here keeps output recognisably Shirt Bazaar, and
 *  the no-letterforms rule is the single most important line in the file:
 *  the model cannot spell, so it is never asked to.
 *
 *  Structured as a config block rather than prose deliberately — GPT Image 2
 *  follows schema-shaped prompts far more closely on scenes with several
 *  interacting systems (subject, palette, lighting, composition).
 */

/** Longest idea we accept. Past this the user is writing the art direction,
 *  which is the model's drift failure mode, not a feature. */
export const MAX_PROMPT_LENGTH = 200
export const MIN_PROMPT_LENGTH = 3

export function buildPrompt(userText: string, vibeName: string | null): string {
  const idea = userText.trim()

  return `/* SHIRT_PRINT_CONFIG: 1-of-1 Design
   VERSION: 1.0.0
   AESTHETIC: Screen-printed streetwear poster art */
{
  "GLOBAL_SETTINGS": {
    "artifact": "flat screen-print artwork for the front of a t-shirt, not a photograph of a shirt",
    "aspect_ratio": "portrait 2:3",
    "style": "bold pictorial line art, thick confident linework, vintage woodcut and tattoo-flash influence"
  },
  "SUBJECT": ${JSON.stringify(idea)},
  "VIBE": ${JSON.stringify(vibeName ?? "unfiled")},
  "COMPOSITION": {
    "framing": "single centred hero subject, symmetrical, generous margin on all four sides",
    "background": "flat near-black field, subtle halo glow behind the subject, no scenery"
  },
  "PALETTE": ["antique gold", "bone white", "muted teal", "deep crimson"],
  "RENDER_FLAGS": ["high_contrast", "crisp_linework", "print_ready", "no_CGI_tell"],
  "AVOID": [
    "any words, letters, numerals or letterforms anywhere in the image",
    "photographic realism or a mockup of a physical shirt",
    "washed-out pastel haze"
  ]
}`
}
