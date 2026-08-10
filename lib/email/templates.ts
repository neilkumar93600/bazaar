/** Every email this app sends, in one file.
 *
 *  Each template is a pure function returning a subject and a body — no
 *  provider, no database, no request. That is what makes them testable, and
 *  it's why the send points (lib/purchase/deliver.ts, the order action, the
 *  newsletter action) stay two lines long.
 *
 *  All of them go through renderEmail, so the Brainfish shell — cream sheet on
 *  paper, ink hairlines, one lime CTA, one Fraunces italic word per
 *  headline — is defined once in layout.ts and cannot drift between templates.
 */

import { renderEmail, type MetaRow } from "./layout.ts"
import { siteName, siteUrl } from "../site.ts"
import { formatCents, formatListingPrice } from "../utils.ts"

export type Email = { subject: string; html: string }

const absolute = (link: string) =>
  link.startsWith("http") ? link : `${siteUrl}${link}`

const shortId = (id: string) => id.slice(0, 8).toUpperCase()

/** A design bought outright — the claim that makes the buyer its owner.
 *
 *  The artwork file rides along as an attachment (see lib/purchase/deliver.ts),
 *  which is why the copy is explicit that it is the flat design and not a
 *  photo of a shirt. */
export function purchaseReceiptEmail(input: {
  orderId: string
  buyerName: string
  designLabel: string
  /** Null is free — a decision by the maker, so it reads as a word. */
  priceCents: number | null
  purchasedAt: Date
  storefrontUrl: string
}): Email {
  const meta: MetaRow[] = [
    { label: "Design", value: input.designLabel },
    { label: "Order", value: shortId(input.orderId), mono: true },
    { label: "Date", value: input.purchasedAt.toISOString().slice(0, 10), mono: true },
    { label: "Paid", value: formatListingPrice(input.priceCents), mono: true },
  ]

  return {
    subject: `Your ${siteName} receipt — ${input.designLabel}`,
    html: renderEmail({
      preheader: `${input.designLabel} is yours. The artwork file is attached.`,
      eyebrow: "Receipt",
      heading: { before: "It's", emphasis: "yours", after: "now." },
      paragraphs: [
        `${input.buyerName}, this design has one owner and it's you — a 1-of-1, never minted again.`,
        "The artwork file is attached to this email. It's the flat design itself, not a shirt photo, so it prints, posts and layers wherever you want it.",
      ],
      meta,
      cta: { label: "View your storefront", href: input.storefrontUrl },
      footnote:
        "Keep this email — the attachment is your copy of the file, and the order number above is what support will ask for.",
    }),
  }
}

/** A printed garment ordered from a claimed design. */
export function garmentOrderEmail(input: {
  orderId: string
  buyerName: string
  designLabel: string
  garmentLabel: string
  priceCents: number
  placedAt: Date
}): Email {
  return {
    subject: `${siteName} order ${shortId(input.orderId)} — on its way`,
    html: renderEmail({
      preheader: `Your ${input.garmentLabel} is going into production.`,
      eyebrow: "Order confirmed",
      heading: { before: "Into", emphasis: "production", after: "it goes." },
      paragraphs: [
        `Thanks ${input.buyerName}. Your order is placed and heading to our print partner.`,
        "You'll get a tracking update as soon as it ships. Printing usually starts within a couple of days.",
      ],
      meta: [
        { label: "Item", value: input.garmentLabel },
        { label: "Design", value: input.designLabel },
        { label: "Order", value: shortId(input.orderId), mono: true },
        { label: "Date", value: input.placedAt.toISOString().slice(0, 10), mono: true },
        { label: "Paid", value: formatCents(input.priceCents), mono: true },
      ],
      cta: { label: "Track your order", href: `${siteUrl}/dashboard/orders` },
      footnote:
        "The design's owner earns a royalty on this order. Damaged or wrong on arrival? Reply within 14 days and we'll reprint it.",
    }),
  }
}

export type NotificationEmailInput = {
  /** Mirrors public.notifications.type exactly — one taxonomy, no mapping
   *  table to fall out of sync. */
  type: "claim" | "royalty" | "message" | "order"
  /** The notification row's own title, written by the database trigger. */
  title: string
  body: string | null
  /** In-app path, e.g. "/dashboard/designs". */
  link: string | null
}

/** The four in-app notifications, as email.
 *
 *  ponytail: nothing sends these yet — notifications are written by database
 *  triggers, and a trigger cannot make an HTTP call. Wire them from a Supabase
 *  webhook or a cron sweep over unread rows when they should leave the app;
 *  the template side is done either way, and honours
 *  notification_preferences the moment the sender checks it. */
export function notificationEmail(input: NotificationEmailInput): Email {
  const href = absolute(input.link ?? "/dashboard/notifications")

  switch (input.type) {
    case "claim":
      return {
        subject: `${input.title} — ${siteName}`,
        html: renderEmail({
          preheader: input.title,
          eyebrow: "Claim",
          heading: { before: "A design you made just got", emphasis: "claimed" },
          paragraphs: [
            input.title,
            "Whoever claimed it owns it outright now. Your side of it is settled — makers are paid at the claim, and nothing else is asked of you.",
          ],
          cta: { label: "See your designs", href },
        }),
      }

    case "royalty":
      return {
        subject: `${input.title} — ${siteName}`,
        html: renderEmail({
          preheader: input.title,
          eyebrow: "Royalty",
          heading: { before: "You", emphasis: "earned", after: "on that one." },
          paragraphs: [
            input.title,
            "Every printed order of a design you own pays you a royalty. The ledger on your settings page has the detail.",
          ],
          cta: { label: "View earnings", href },
        }),
      }

    case "message":
      return {
        subject: input.title,
        html: renderEmail({
          preheader: input.body ?? input.title,
          eyebrow: "Message",
          heading: { before: "Someone", emphasis: "wrote", after: "to you." },
          paragraphs: [input.title, input.body ?? "Open the thread to read it."],
          cta: { label: "Read and reply", href },
        }),
      }

    case "order":
      return {
        subject: `${input.title} — ${siteName}`,
        html: renderEmail({
          preheader: input.title,
          // The mint pill *is* the label here. Stacking an "Order update"
          // eyebrow under it is two badges saying one thing.
          status: input.body ?? undefined,
          eyebrow: input.body ? undefined : "Order update",
          heading: { before: "Your order", emphasis: "moved", after: "along." },
          paragraphs: [
            input.title,
            "Nothing is needed from you — this is the shipment working its way through.",
          ],
          cta: { label: "Track your order", href },
        }),
      }
  }
}

/** Confirms a newsletter signup. The only non-transactional send, so it is
 *  the only one carrying an unsubscribe line. */
export function newsletterWelcomeEmail(): Email {
  return {
    subject: `You're on the ${siteName} list`,
    html: renderEmail({
      preheader: "New drops, claimed designs, and nothing else.",
      eyebrow: "Subscribed",
      heading: { before: "Consider yourself", emphasis: "listed" },
      paragraphs: [
        "You'll hear from us when there's something worth hearing about: new drops, designs worth claiming before someone else does, and the occasional note on what we're building.",
        "No daily digest, no drip sequence.",
      ],
      cta: { label: "Browse the bazaar", href: `${siteUrl}/shop` },
      footnote:
        "Didn't sign up? Ignore this and you'll hear nothing more — or reply and we'll take the address off entirely.",
    }),
  }
}
