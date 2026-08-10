/** Renders every email to .email-preview/ so they can be opened in a browser.
 *
 *  Run: `npx tsx scripts/preview-emails.ts`
 *
 *  ponytail: an email is the one surface with no page to load and no dev
 *  server to check it in. Twelve lines of writeFileSync beats sending yourself
 *  test mail every time a word changes. Nothing imports this — it is a tool,
 *  not a dependency. The output directory is gitignored.
 */

import { mkdirSync, writeFileSync } from "node:fs"

import {
  garmentOrderEmail,
  newsletterWelcomeEmail,
  notificationEmail,
  purchaseReceiptEmail,
} from "../lib/email/templates.ts"

const now = new Date("2026-08-10T12:00:00Z")

const EMAILS = {
  "purchase-receipt-paid": purchaseReceiptEmail({
    orderId: "8f2c1a34-0000-4000-8000-000000000001",
    buyerName: "Ada Lovelace",
    designLabel: "Skull in bloom",
    priceCents: 2900,
    purchasedAt: now,
    storefrontUrl: "http://localhost:3000/creator/ada",
  }),
  "purchase-receipt-free": purchaseReceiptEmail({
    orderId: "8f2c1a34-0000-4000-8000-000000000001",
    buyerName: "Ada Lovelace",
    designLabel: "Quiet riot",
    priceCents: null,
    purchasedAt: now,
    storefrontUrl: "http://localhost:3000/creator/ada",
  }),
  "garment-order": garmentOrderEmail({
    orderId: "1a2b3c4d-0000-4000-8000-000000000002",
    buyerName: "Ada",
    designLabel: "Skull in bloom",
    garmentLabel: "Heavy cotton tee",
    priceCents: 3400,
    placedAt: now,
  }),
  "notification-claim": notificationEmail({
    type: "claim",
    title: "Someone claimed a design you created",
    body: null,
    link: "/dashboard/designs",
  }),
  "notification-royalty": notificationEmail({
    type: "royalty",
    title: "You earned a royalty",
    body: null,
    link: "/dashboard/settings",
  }),
  "notification-message": notificationEmail({
    type: "message",
    title: "New message from @ada",
    body: "Is this one still going, or has somebody taken it?",
    link: "/dashboard/messages/ada",
  }),
  "notification-order": notificationEmail({
    type: "order",
    title: "Your order is in production",
    body: "In production",
    link: "/dashboard/orders",
  }),
  "newsletter-welcome": newsletterWelcomeEmail(),
}

mkdirSync(".email-preview", { recursive: true })

for (const [name, email] of Object.entries(EMAILS)) {
  writeFileSync(`.email-preview/${name}.html`, email.html)
  console.log(`${name} — ${email.subject}`)
}
