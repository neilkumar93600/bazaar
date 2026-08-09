import Link from "next/link"

import { HOME_FAQ } from "@/lib/faq"
import { SectionTag } from "@/components/home/SectionTag"

/** The section that does the work social proof would normally do.
 *
 *  A marketplace with no users can't show testimonials or volume, so it answers
 *  objections instead. Every answer here is traceable to real behaviour — the
 *  claim model, the generation cap, the storefront URL — and the two numbers
 *  come from the constants that govern them rather than being retyped, so this
 *  copy can't drift out of agreement with the product.
 *
 *  Server component on purpose: the shared list reads an env var for the
 *  generation cap. Disclosure uses native <details>, so the section ships no
 *  JavaScript.
 *
 *  The four questions live in lib/faq.ts alongside the rest — /faq answers the
 *  same ones in full, and two copies would drift. */

export function HomeFaq() {
  return (
    <section className="flex flex-col gap-8 lg:flex-row lg:gap-16">
      <div className="flex flex-col gap-3 lg:w-[38%] lg:shrink-0">
        <SectionTag>Before you claim</SectionTag>
        <h2 className="text-heading text-foreground">
          The questions worth{" "}
          {/* One Fraunces italic word, as ever. */}
          <span className="font-serif font-medium italic">asking</span>
        </h2>
        <p className="text-body-sm text-muted-ink">
          Short answers. Nothing here depends on us having an audience yet.
        </p>
        <Link
          href="/faq"
          className="text-body-sm text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground"
        >
          All questions →
        </Link>
      </div>

      <div className="flex flex-1 flex-col border-t border-border">
        {HOME_FAQ.map(({ q, a }) => (
          <details key={q} className="group border-b border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-body font-medium text-foreground marker:hidden">
              {q}
              {/* Rotates via the open state — no JS, no icon library. */}
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
  )
}
