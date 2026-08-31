import type { Metadata } from "next"
import Link from "next/link"

import { FAQ_GROUPS } from "@/lib/faq"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Everything you need to know about buying shirts, owning 100% commercial IP rights, auto-provisioned creator storefronts, and automated print-on-demand fulfillment.",
  alternates: { canonical: "/faq" },
}

/** Native <details>, so the page ships no JavaScript. Also emits FAQPage
 *  structured data — the answers are already written, and this is the one
 *  schema type that earns its markup on a page like this. */
export default function FaqPage() {
  const all = FAQ_GROUPS.flatMap((group) => group.entries)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16 md:px-16 sm:py-24">
      <script
        type="application/ld+json"
        // Static, non-user-derived literal — nothing here is attacker-controlled.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: all.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />

      <div className="flex flex-col gap-3">
        <h1 className="text-display text-foreground uppercase tracking-tight">
          Questions
        </h1>
        <p className="text-body max-w-xl text-muted-foreground">
          Everything worth asking before you claim something permanent.
        </p>
      </div>

      {FAQ_GROUPS.map((group) => (
        <section key={group.heading} className="flex flex-col gap-1">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            {group.heading}
          </h2>
          <div className="flex flex-col border-t border-border">
            {group.entries.map(({ q, a }) => (
              <details key={q} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-body font-medium text-foreground marker:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="text-subheading leading-none text-muted-gray transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-body-sm text-muted-ink">{a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
        <h2 className="text-subheading text-foreground">Still stuck?</h2>
        <p className="text-body-sm text-muted-foreground">
          The binding versions live in the{" "}
          <Link href="/terms" className="text-primary underline underline-offset-4">
            Terms of Service
          </Link>
          ,{" "}
          <Link
            href="/ip-policy"
            className="text-primary underline underline-offset-4"
          >
            Commercial IP Policy
          </Link>
          ,{" "}
          <Link
            href="/refund-policy"
            className="text-primary underline underline-offset-4"
          >
            Refund Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-primary underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          . Anything they don&apos;t answer,{" "}
          <Link
            href="/contact"
            className="text-primary underline underline-offset-4"
          >
            write to us
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
