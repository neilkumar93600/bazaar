import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { DAILY_IMAGE_CAP } from "@/lib/generation/quota"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"

export const metadata: Metadata = {
  title: "About | Shirt Bazaar",
  description:
    "How Shirt Bazaar bundles 1-of-1 physical apparel with full commercial IP copyright assignment and turnkey creator storefronts.",
  alternates: { canonical: "/about" },
}

const STATS = [
  {
    number: "1-of-1",
    label: "Genesis Exclusivity",
    subtext: "Permanent architecture — claimed once, owned forever.",
  },
  {
    number: "100%",
    label: "Commercial Rights",
    subtext: "Full legal copyright assignment conveyed on claim.",
  },
  {
    number: `${ROYALTY_RATE_PERCENT}%`,
    label: "Resale Royalty",
    subtext: "Ongoing creator earnings on every secondary print sale.",
  },
  {
    number: "Zero",
    label: "Upfront Inventory",
    subtext: "Automated dropshipping via premium on-demand DTG.",
  },
]

const PRINCIPLES = [
  {
    num: "01",
    heading: "Exclusive by architecture, not as an upsell",
    body: "A design gets claimed exactly once in history. That is not a premium tier or an expensive add-on — it is the fundamental rule governing every asset on the platform. Exclusivity isn't a feature bolted onto a shop; it is the reason the shop exists.",
  },
  {
    num: "02",
    heading: "The claim is permanent and immutable",
    body: "No reprints by third parties, no second editions, and no quiet restocks when an artwork gains popularity. A claim that could be unwound or cloned would devalue every other genesis drop, so claims remain permanent forever.",
  },
  {
    num: "03",
    heading: "Curatorial taste keeps working for you",
    body: `When you spot and claim a design first, you earn an automatic ${ROYALTY_RATE_PERCENT}% royalty on every future customer order printed with that design. Identifying great aesthetics first is real work, and you should be compensated continuously for it.`,
  },
  {
    num: "04",
    heading: "Browse-and-claim, not build-your-own",
    body: "Generic print-on-demand forces you to become a graphic designer and warehouse manager. Mass-market blanks force you to settle for the same print as thousands of strangers. Shirt Bazaar makes finished 1-of-1 works discoverable so you can immediately own what is unmistakably yours.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-16 sm:py-24 md:px-12">
      {/* Hero Section */}
      <div className="flex flex-col gap-6 border-b border-rule pb-12">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted-gray">
          <Sparkles className="h-3.5 w-3.5 text-ink" />
          <span>The 1-of-1 Paradigm</span>
          <span>/</span>
          <span>Manifesto</span>
        </div>

        <h1 className="text-display font-semibold tracking-tight text-ink sm:text-6xl">
          One prompt in.
          <br />
          One shirt out.
          <br />
          <span className="font-serif italic font-normal text-ink">
            One owner.
          </span>
        </h1>

        <p className="max-w-3xl text-body text-muted-ink leading-relaxed">
          Shirt Bazaar is the world&apos;s first marketplace for 1-of-1 generative apparel.
          Every genesis design exists exactly once, belongs to one person with 100% commercial IP rights,
          and instantly provisions an automated custom merch storefront.
        </p>
      </div>

      {/* Cream Stat Cards Row (Specified in docs/DESIGN.md) */}
      <section aria-label="Key Platform Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col justify-between gap-4 rounded-[8px] border border-rule bg-cream p-6 transition-all hover:border-ink hover:shadow-[2px_2px_0_0_#262626]"
          >
            <span className="font-sans text-[44px] sm:text-[48px] font-semibold leading-none text-ink tracking-tight">
              {stat.number}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-medium text-ink">
                {stat.label}
              </h3>
              <p className="text-[13px] text-muted-ink leading-relaxed">
                {stat.subtext}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Why it Works This Way */}
      <section className="flex flex-col gap-6 border-t border-rule pt-12">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-gray">
          <span>01 / Philosophy</span>
        </div>
        <h2 className="text-heading font-semibold text-ink">
          Why it works{" "}
          <span className="font-serif italic font-normal text-ink">
            this way.
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-body text-muted-ink leading-relaxed">
          <p>
            Buying apparel today is usually a compromise between two flawed extremes. Mass retail is fast and affordable but entirely generic — the exact same screenprint stamped on hundreds of thousands of blanks.
          </p>
          <p>
            Traditional custom merchandise is exhausting: you must master complex design software, configure third-party fulfillment plugins, hold inventory, and manually handle shipping logistics.
          </p>
          <p className="md:col-span-2 rounded-[8px] border border-ink bg-cream p-6 text-ink shadow-[2px_2px_0_0_#262626]">
            <strong>Our Solution:</strong> Artwork is generated upfront through state-of-the-art machine learning models. You explore a stream of finished, high-resolution designs. When you claim one, commercial copyright transfers to you, and an automated storefront at <code>/creator/[yourhandle]</code> goes live in under a minute with automated print-on-demand fulfillment.
          </p>
        </div>
      </section>

      {/* What We Hold To — Core Principles */}
      <section className="flex flex-col gap-8 border-t border-rule pt-12">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-gray">
          <span>02 / Governance</span>
        </div>
        <h2 className="text-heading font-semibold text-ink">
          What we{" "}
          <span className="font-serif italic font-normal text-ink">
            hold to.
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRINCIPLES.map((principle) => (
            <div
              key={principle.heading}
              className="flex flex-col gap-3 rounded-[8px] border border-rule bg-cream p-6 sm:p-8 transition-all hover:border-ink hover:shadow-[2px_2px_0_0_#262626]"
            >
              <span className="font-mono text-xs font-semibold text-muted-gray">
                {principle.num}
              </span>
              <h3 className="text-subheading font-semibold text-ink">
                {principle.heading}
              </h3>
              <p className="text-body-sm text-muted-ink leading-relaxed">
                {principle.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Where We Actually Are */}
      <section className="flex flex-col gap-6 border-t border-rule pt-12">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-gray">
          <span>03 / Transparency</span>
        </div>
        <h2 className="text-heading font-semibold text-ink">
          Where we{" "}
          <span className="font-serif italic font-normal text-ink">
            actually are.
          </span>
        </h2>
        <div className="flex flex-col gap-4 text-body text-muted-ink leading-relaxed max-w-3xl">
          <p>
            We are early, and we believe in radical transparency. Designs are synthesized by cutting-edge diffusion models against your prompts — with {DAILY_IMAGE_CAP} free generations every 24 hours per account. Physical shirts are custom printed via certified direct-to-garment (DTG) facilities and shipped worldwide.
          </p>
          <p>
            Genesis claiming, 100% commercial IP assignment, instant custom storefront provisioning, and automated buyer ordering are fully live today.
          </p>
        </div>
      </section>

      {/* Action Buttons Section */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-12">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-[4px] border border-ink bg-lime-sprint px-6 py-3 text-sm font-medium text-ink shadow-[2px_2px_0_0_#262626] transition-all hover:brightness-105 active:translate-y-px active:shadow-none"
        >
          <span>Browse the Bazaar</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 rounded-[4px] border border-ink bg-paper-white px-6 py-3 text-sm font-medium text-ink transition-all hover:bg-cream hover:shadow-[2px_2px_0_0_#262626] active:translate-y-px"
        >
          <span>Launch AI Studio</span>
        </Link>
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 rounded-[4px] border border-rule bg-paper-white px-5 py-3 text-sm font-medium text-muted-ink hover:border-ink hover:text-ink transition-all"
        >
          <span>Read FAQ</span>
        </Link>
      </div>
    </div>
  )
}
