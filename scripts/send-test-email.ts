#!/usr/bin/env node
/**
 * Sends one real email through whatever sender .env.local is configured for.
 *
 *   npx tsx scripts/send-test-email.ts you@example.com
 *
 * Exists because sendEmail swallows its failures by design — every caller is
 * downstream of a completed purchase, so a throw there would fail a claim that
 * already happened. The cost is that a bad App Password looks exactly like a
 * working one until a buyer doesn't get their file. This is the check.
 *
 * It sends both halves of a real purchase — the receipt, and the file email
 * with an attachment fetched from a URL — so a pass here means the whole
 * delivery path works, not just the credentials. The attachment is the part
 * worth testing: the sender fetches those bytes itself, so a URL it can't
 * reach is a buyer who gets an empty email and no product.
 *
 * Pass your own artwork URL as the second argument to test a real one.
 */

// First, and before anything that reads the environment: siteUrl and the mail
// credentials are both read the moment their modules evaluate.
import "./load-env.ts"

import { designFileEmail, purchaseReceiptEmail } from "../lib/email/templates.ts"
import { sendEmail } from "../lib/email/send.ts"
import { siteUrl } from "../lib/site.ts"

const to = process.argv[2]
if (!to) {
  console.error("Usage: npx tsx scripts/send-test-email.ts you@example.com")
  process.exit(1)
}

// Any stable public image will do — this only proves the sender can fetch a
// URL and attach the bytes.
const artworkUrl =
  process.argv[3] ??
  "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"

const sender = process.env.GMAIL_USER
  ? `Gmail (${process.env.GMAIL_USER})`
  : process.env.RESEND_API_KEY
    ? "Resend"
    : "nothing — no sender configured"

console.log(`Sending to ${to} via ${sender}`)

const storefrontUrl = `${siteUrl}/creator/test`

const receipt = await sendEmail({
  to,
  ...purchaseReceiptEmail({
    orderId: "8f2c1a34-0000-4000-8000-000000000001",
    buyerName: "Test Buyer",
    designLabel: "Delivery test",
    priceCents: null,
    purchasedAt: new Date(),
    storefrontUrl,
  }),
})

const file = await sendEmail({
  to,
  ...designFileEmail({
    buyerName: "Test Buyer",
    designLabel: "Delivery test",
    storefrontUrl,
  }),
  attachments: [{ filename: "delivery-test.png", path: artworkUrl }],
})

console.log(`receipt: ${receipt ? "sent" : "FAILED"}`)
console.log(`design file: ${file ? "sent" : "FAILED"}`)
console.log(
  receipt && file
    ? "check the inbox — two emails, one with an attachment"
    : "see the error above",
)
process.exit(receipt && file ? 0 : 1)
