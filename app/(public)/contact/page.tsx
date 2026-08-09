import type { Metadata } from "next"
import Link from "next/link"

import { CONTACT_EMAILS } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Shirt Bazaar about an order, a claim, a privacy request, or anything the FAQ doesn't answer.",
  alternates: { canonical: "/contact" },
}

/** ponytail: mailto, not a form. A form needs a table, spam handling and
 *  somebody watching the table — three things that can silently fail — whereas
 *  mail lands in an inbox that already exists. Swap in a form the day there is
 *  a support queue to feed. */
const ROUTES = [
  {
    heading: "Orders and shirts",
    email: CONTACT_EMAILS.support,
    body: "A shirt that arrived damaged, wrong or not at all. Include your order number and, for anything physical, photos — that's what we need to arrange a reprint or refund.",
    window: "Within 14 days of delivery for defects and mis-prints.",
  },
  {
    heading: "Claims and storefronts",
    email: CONTACT_EMAILS.support,
    body: "Something wrong with a claim, a storefront that isn't showing what it should, or a question about the resale royalty.",
    window: null,
  },
  {
    heading: "Privacy and your data",
    email: CONTACT_EMAILS.privacy,
    body: "Access, correction or deletion of your personal data, and anything else covered by the Privacy Policy.",
    window: null,
  },
  {
    heading: "Legal and takedowns",
    email: CONTACT_EMAILS.legal,
    body: "Copyright or trademark claims, and anything relating to the Terms of Service.",
    window: null,
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16 md:px-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <h1 className="text-display text-foreground uppercase tracking-tight">
          Contact
        </h1>
        <p className="text-body max-w-xl text-muted-foreground">
          Pick the inbox that matches — it gets you a faster answer than a
          general one. Most questions are already answered in the{" "}
          <Link href="/faq" className="text-primary underline underline-offset-4">
            FAQ
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col">
        {ROUTES.map((route) => (
          <div
            key={route.heading}
            className="grid grid-cols-1 gap-3 border-t border-hairline py-8 first:border-t-0 first:pt-0 lg:grid-cols-[220px_1fr] lg:gap-8"
          >
            <h2 className="text-subheading text-foreground">{route.heading}</h2>
            <div className="flex flex-col items-start gap-3">
              <p className="text-body text-muted-foreground">{route.body}</p>
              <a
                href={`mailto:${route.email}`}
                className="font-mono text-body-sm text-primary underline underline-offset-4"
              >
                {route.email}
              </a>
              {route.window && (
                <p className="font-mono text-caption text-muted-gray">
                  {route.window}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-body-sm text-muted-foreground">
        We read everything that arrives. We&apos;re small, so an answer can take
        a few days — we&apos;d rather say that than publish a response time we
        can&apos;t hold to yet.
      </p>
    </div>
  )
}
