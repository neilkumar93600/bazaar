/** Run: `npx tsx lib/email/templates.test.ts`
 *
 *  ponytail: an email is written once and then never looked at again by
 *  anybody who could notice it broke — there is no page to load and no error
 *  to see. So the checks here are the ones that fail silently in a stranger's
 *  inbox: escaping, free-vs-zero, and the shell rules from docs/DESIGN.md that
 *  a later template could quietly violate.
 */

import assert from "node:assert/strict"

import {
  garmentOrderEmail,
  newsletterWelcomeEmail,
  notificationEmail,
  purchaseReceiptEmail,
  type Email,
} from "./templates.ts"

const RECEIPT = {
  orderId: "8f2c1a34-0000-4000-8000-000000000001",
  buyerName: "Ada Lovelace",
  designLabel: "Skull in bloom",
  priceCents: 2900,
  purchasedAt: new Date("2026-08-10T12:00:00Z"),
  storefrontUrl: "https://example.com/creator/ada",
}

const priced = purchaseReceiptEmail(RECEIPT)
assert.match(priced.subject, /Skull in bloom/)
assert.match(priced.html, /\$29\.00/)
assert.match(priced.html, /8F2C1A34/)
assert.match(priced.html, /2026-08-10/)
assert.match(priced.html, /https:\/\/example\.com\/creator\/ada/)

// Free is a decision by the maker, not a missing number.
const free = purchaseReceiptEmail({ ...RECEIPT, priceCents: null })
assert.match(free.html, />Free</)
assert.doesNotMatch(free.html, /\$0\.00/)

// Markup in a prompt or a display name is text, not markup.
const hostile = purchaseReceiptEmail({
  ...RECEIPT,
  buyerName: '<script>alert("x")</script>',
  designLabel: "Ampersand & <b>bold</b>",
})
assert.doesNotMatch(hostile.html, /<script>/)
assert.doesNotMatch(hostile.html, /<b>bold<\/b>/)
assert.match(hostile.html, /&lt;script&gt;/)
assert.match(hostile.html, /Ampersand &amp; /)

const everyEmail: Email[] = [
  priced,
  free,
  garmentOrderEmail({
    orderId: "1a2b3c4d-0000-4000-8000-000000000002",
    buyerName: "Ada",
    designLabel: "Skull in bloom",
    garmentLabel: "Heavy cotton tee",
    priceCents: 3400,
    placedAt: new Date("2026-08-10T12:00:00Z"),
  }),
  notificationEmail({
    type: "claim",
    title: "Someone claimed a design you created",
    body: null,
    link: "/dashboard/designs",
  }),
  notificationEmail({
    type: "royalty",
    title: "You earned a royalty",
    body: null,
    link: "/dashboard/settings",
  }),
  notificationEmail({
    type: "message",
    title: "New message from @ada",
    body: "Is this one still going?",
    link: "/dashboard/messages/ada",
  }),
  notificationEmail({
    type: "order",
    title: "Your order is in production",
    body: "in-production",
    link: "/dashboard/orders",
  }),
  newsletterWelcomeEmail(),
]

for (const email of everyEmail) {
  assert.notEqual(email.subject.trim(), "", "every email needs a subject")

  // docs/DESIGN.md: exactly one Fraunces italic emphasis word per headline.
  const emphasis = email.html.match(/<em style="font-family:'Fraunces'/g) ?? []
  assert.equal(emphasis.length, 1, `one emphasis word, got ${emphasis.length}`)

  // docs/DESIGN.md: lime is the action colour and appears at most once — the
  // single CTA. Never as text, never decorative.
  const lime = email.html.match(/#a3e635/g) ?? []
  assert.ok(lime.length <= 1, `lime used ${lime.length} times`)

  // "every shadow is a 2px solid ink offset, or it doesn't exist" — a blur
  // radius is the tell that somebody pasted a normal web shadow in.
  assert.doesNotMatch(email.html, /box-shadow:[^;"]*\dpx \dpx \dpx/)

  // Pure black is not a border or fill colour in this system; ink is.
  assert.doesNotMatch(email.html, /:\s*#000000/)

  // A preheader is what the inbox list shows. Empty means the client invents
  // one out of the first markup it finds.
  assert.match(email.html, /<div style="display:none[^>]*>[^<]+<\/div>/)
}

console.log(`templates.test.ts ok — ${everyEmail.length} emails`)
