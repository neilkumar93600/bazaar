/** The email shell — Brainfish (docs/DESIGN.md) rendered in the subset of HTML
 *  that mail clients actually run.
 *
 *  Three rules the site never has to think about and this file always does:
 *
 *  1. No stylesheet, no classes, no tokens. Gmail strips <style> and knows
 *     nothing about `--color-ink`, so every value below is the literal hex
 *     from the palette, inlined. That is why the design doc's colours are
 *     spelled out here rather than imported — there is nothing to import from
 *     in an email.
 *  2. Tables, not flexbox. Outlook's renderer is Word.
 *  3. Geist and Fraunces cannot be loaded, so both degrade on purpose: Geist
 *     to the system sans stack, Fraunces to Georgia italic. The editorial
 *     signature — one italic serif word inside a sans headline — survives the
 *     substitution, which is the only reason it is safe to keep.
 *
 *  Every caller passes plain text. Escaping happens here, once.
 */

import { CONTACT_EMAILS, siteName, siteUrl } from "../site.ts"

/** docs/DESIGN.md § Tokens — Colors. Names match the doc so a change there is
 *  greppable here. */
const INK = "#262626"
const PAPER = "#ffffff"
const CREAM = "#fcfff7"
const RULE = "#e5e5e5"
const MUTED = "#525252"
const MUTED_GRAY = "#737373"
const LIME = "#a3e635"
const MINT_EDGE = "#7ee2b8"
const MINT_WASH = "#dcfff1"

const SANS =
  "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
/** Fraunces italic, and its stand-in everywhere Fraunces isn't installed. */
const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif"
const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** docs/DESIGN.md: "Pair every weight-600 headline with exactly one Fraunces
 *  italic emphasis word." The shape of this type is that rule — a heading
 *  cannot be built here without its one emphasis word. */
export type Heading = {
  before?: string
  emphasis: string
  after?: string
}

export type Cta = {
  label: string
  href: string
}

export type MetaRow = {
  label: string
  value: string
  /** Prices, ids and dates set in Geist Mono — the doc's "tabular meta". */
  mono?: boolean
}

export type EmailBody = {
  /** Inbox preview line. Never rendered visibly. */
  preheader: string
  /** Tiny uppercase pill above the headline. */
  eyebrow?: string
  heading: Heading
  /** Paragraphs, in order. Plain text. */
  paragraphs: string[]
  meta?: MetaRow[]
  /** The one lime button. docs/DESIGN.md: used sparingly, once per view. */
  cta?: Cta
  /** Mint status pill — live/health indicators only, per the doc. */
  status?: string
  /** Small print above the footer. */
  footnote?: string
}

function headingHtml(heading: Heading) {
  const emphasis = `<em style="font-family:${SERIF};font-style:italic;font-weight:600">${escapeHtml(heading.emphasis)}</em>`

  return [
    heading.before ? escapeHtml(heading.before) : "",
    emphasis,
    heading.after ? escapeHtml(heading.after) : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function metaHtml(rows: MetaRow[]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:24px 0 0">
        ${rows
          .map(
            (row, index) => `<tr>
          <td style="padding:12px 0;${index === 0 ? "" : `border-top:1px solid ${RULE};`}font-family:${SANS};font-size:14px;line-height:1.14;color:${MUTED_GRAY};text-transform:uppercase;letter-spacing:0.08em">${escapeHtml(row.label)}</td>
          <td align="right" style="padding:12px 0;${index === 0 ? "" : `border-top:1px solid ${RULE};`}font-family:${row.mono ? MONO : SANS};font-size:16px;line-height:1.25;color:${INK}">${escapeHtml(row.value)}</td>
        </tr>`
          )
          .join("\n        ")}
      </table>`
}

/** The lime primary button: 4px radius, 1px ink border, and the 2px solid ink
 *  offset *at rest* that the doc insists on in place of any blurred shadow.
 *
 *  ponytail: the offset is a box-shadow, which Outlook and some Gmail views
 *  drop. What is left is a bordered lime button — the design degraded, not
 *  broken. The table-in-table hack that survives Outlook costs twenty lines to
 *  save a two-pixel edge in one client. */
function ctaHtml(cta: Cta) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:28px 0 0">
        <tr>
          <td style="border-radius:4px;background:${LIME};border:1px solid ${INK};box-shadow:2px 2px 0 0 ${INK}">
            <!-- 12px vertical padding puts the tap target at ~46px. Phones
                 are where most of these get opened. -->
            <a href="${encodeURI(cta.href)}" style="display:inline-block;padding:12px 20px;font-family:${SANS};font-size:16px;font-weight:500;line-height:1.25;color:${INK};text-decoration:none">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
}

function statusHtml(status: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 0 16px">
        <tr>
          <td style="background:${MINT_WASH};border:1px solid ${MINT_EDGE};border-radius:9999px;padding:6px 12px;font-family:${SANS};font-size:14px;font-weight:500;line-height:1.14;color:${INK}">${escapeHtml(status)}</td>
        </tr>
      </table>`
}

function eyebrowHtml(eyebrow: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 0 16px">
        <tr>
          <td style="border:1px solid ${INK};border-radius:9999px;padding:4px 10px;font-family:${SANS};font-size:12px;font-weight:500;line-height:1.14;letter-spacing:0.08em;text-transform:uppercase;color:${INK}">${escapeHtml(eyebrow)}</td>
        </tr>
      </table>`
}

export function renderEmail(body: EmailBody) {
  const wordmark = siteName.toUpperCase()

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- The palette is a light one and inverting it breaks the lime/ink contrast
     pair outright, so clients are asked to leave it alone. -->
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(body.preheader)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(body.preheader)}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:${PAPER};border-collapse:collapse">
    <tr>
      <td align="center" style="padding:32px 16px 56px">

        <!-- width:100% + max-width, never width="600". A fixed table width
             wins the table-sizing circularity against max-width:100% and the
             whole email ends up 600px wide inside a 375px phone, scrolling
             sideways in Gmail. -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;border-collapse:collapse">

          <!-- Wordmark on a bare white line: no shadow, no border. The doc's
               top navigation, reduced to the one element an email needs. -->
          <tr>
            <td style="padding:0 0 28px;font-family:${SANS};font-size:16px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${INK}">
              <a href="${siteUrl}" style="color:${INK};text-decoration:none">${escapeHtml(wordmark)}</a>
            </td>
          </tr>

          <!-- Cream Sheet: the only lift above paper. 8px radius, 1px rule,
               24px padding, and deliberately no shadow. -->
          <tr>
            <td style="background:${CREAM};border:1px solid ${RULE};border-radius:8px;padding:32px 24px">
              ${body.status ? statusHtml(body.status) : ""}
              ${body.eyebrow ? eyebrowHtml(body.eyebrow) : ""}

              <h1 style="margin:0;font-family:${SANS};font-size:36px;line-height:1.14;letter-spacing:-0.18px;font-weight:600;color:${INK}">${headingHtml(body.heading)}</h1>

              ${body.paragraphs
                .map(
                  (paragraph) =>
                    `<p style="margin:16px 0 0;font-family:${SANS};font-size:18px;line-height:1.55;color:${MUTED}">${escapeHtml(paragraph)}</p>`
                )
                .join("\n              ")}

              ${body.meta ? metaHtml(body.meta) : ""}
              ${body.cta ? ctaHtml(body.cta) : ""}
            </td>
          </tr>

          ${
            body.footnote
              ? `<tr>
            <td style="padding:24px 4px 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${MUTED_GRAY}">${escapeHtml(body.footnote)}</td>
          </tr>`
              : ""
          }

          <tr>
            <td style="padding:24px 4px 0;border-top:1px solid ${RULE};font-family:${SANS};font-size:14px;line-height:1.5;color:${MUTED_GRAY}">
              ${escapeHtml(siteName)} · <a href="${siteUrl}" style="color:${MUTED_GRAY};text-decoration:underline">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a><br>
              Questions: <a href="mailto:${CONTACT_EMAILS.support}" style="color:${MUTED_GRAY};text-decoration:underline">${CONTACT_EMAILS.support}</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
