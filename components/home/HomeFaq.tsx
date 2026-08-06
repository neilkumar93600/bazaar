import { DAILY_CAP } from "@/lib/generation/quota"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"
import { SectionTag } from "@/components/home/SectionTag"

/** The section that does the work social proof would normally do.
 *
 *  A marketplace with no users can't show testimonials or volume, so it answers
 *  objections instead. Every answer here is traceable to real behaviour — the
 *  claim model, the generation cap, the storefront URL — and the two numbers
 *  come from the constants that govern them rather than being retyped, so this
 *  copy can't drift out of agreement with the product.
 *
 *  Server component on purpose: `DAILY_CAP` reads an env var. Disclosure uses
 *  native <details>, so the section ships no JavaScript. */
const QUESTIONS = [
  {
    q: "What does 1-of-1 actually mean?",
    a: "A design can be claimed exactly once. After that it belongs to one person — no reprints, no second edition, no identical shirt on anyone else.",
  },
  {
    q: "Who can claim a design I generate?",
    a: "Anyone. Generated designs land in the bazaar unclaimed, including the ones you made — so if you want one, claim it. That's also why there's always something here to take.",
  },
  {
    q: "How many designs can I generate?",
    a: `${DAILY_CAP} a day per account. Generation costs real money to run, so the cap keeps it open to everyone without a queue.`,
  },
  {
    q: "What do I get when I claim one?",
    a: `Exclusive ownership of the design, a storefront of your own at bazaar.app/creator/yourhandle to show it off, and ${ROYALTY_RATE_PERCENT}% of every resale of that design after yours.`,
  },
]

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
      </div>

      <div className="flex flex-1 flex-col border-t border-border">
        {QUESTIONS.map(({ q, a }) => (
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
