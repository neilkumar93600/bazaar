import type { Metadata } from "next"
import Link from "next/link"

import { CONTACT_EMAILS } from "@/lib/site"

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Shirt Bazaar has no open roles right now. What we'd hire for when that changes, and how to reach us before it does.",
  alternates: { canonical: "/careers" },
}

/** No fabricated openings and no "join our fast-growing team" — the team is
 *  small and the honest version of this page is the only one worth publishing.
 *  Add a real list here the day a role actually opens. */
const INTERESTS = [
  {
    heading: "Generation quality",
    body: "Prompt architecture, style presets, and the cut/keying pipeline that decides whether artwork prints as ink or as a rectangle. Closest thing we have to a core competency.",
  },
  {
    heading: "Fulfilment and ops",
    body: "Print-on-demand integration, garment sourcing, and the unglamorous work of making sure the thing in the box matches the thing on the screen.",
  },
  {
    heading: "Product design",
    body: "Editorial, restrained, opinionated about type. If the phrase “one italic word per headline” sounds like a rule rather than a limitation, we'd get on.",
  },
]

export default function CareersPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16 md:px-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <h1 className="text-display text-foreground uppercase tracking-tight">
          Careers
        </h1>
        <p className="text-body max-w-xl text-muted-foreground">
          No open roles right now. That&apos;s the honest state of it — we&apos;d
          rather leave this page empty than list a job we&apos;re not hiring
          for.
        </p>
      </div>

      <section className="flex flex-col gap-1">
        <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
          What we&apos;d hire for first
        </h2>
        <div className="flex flex-col">
          {INTERESTS.map((interest) => (
            <div
              key={interest.heading}
              className="grid grid-cols-1 gap-3 border-t border-hairline py-8 lg:grid-cols-[220px_1fr] lg:gap-8"
            >
              <h3 className="text-subheading text-foreground">
                {interest.heading}
              </h3>
              <p className="text-body text-muted-foreground">{interest.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
        <h2 className="text-subheading text-foreground">
          Ahead of the posting
        </h2>
        <p className="text-body-sm text-muted-foreground">
          If one of those is squarely your thing, write to{" "}
          <a
            href={`mailto:${CONTACT_EMAILS.support}`}
            className="font-mono text-primary underline underline-offset-4"
          >
            {CONTACT_EMAILS.support}
          </a>{" "}
          with work rather than a CV. We read everything; we can&apos;t promise
          a fast reply, and we won&apos;t keep you in a pipeline that
          doesn&apos;t exist.
        </p>
        <p className="text-body-sm text-muted-foreground">
          Not looking for a job?{" "}
          <Link
            href="/create"
            className="text-primary underline underline-offset-4"
          >
            Make something
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  )
}
