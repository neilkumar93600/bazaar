"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Share2 } from "lucide-react"

import { SectionTag } from "@/components/home/SectionTag"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"

const PREVIEW_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4"

const STEPS = [
  {
    number: "01",
    name: "Claim it",
    copy: "Take the design that speaks to you. The claim is exclusive and permanent — no reprints, no second edition.",
  },
  {
    number: "02",
    name: "Get a storefront",
    copy: "Claiming provisions your own page at bazaar.app/creator/yourhandle, plus 1:1 and 9:16 share cards stamped with your claim.",
  },
  {
    number: "03",
    name: "Earn on resales",
    copy: `Every later resale of your design pays you ${ROYALTY_RATE_PERCENT}% automatically. Your taste keeps working after the sale.`,
  },
]

/** What claiming actually does, and what it produces, in one block.
 *
 *  This used to be two sections — a three-step card row and a separate
 *  "proof of claim" showcase — which explained the same sequence twice and
 *  described the storefront in the abstract before showing it. The steps now run
 *  down the left and the artefact they produce sits on the right. */
export function ClaimSpread() {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-16">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SectionTag>Claim, keep, earn</SectionTag>
          <h2 className="text-heading text-foreground">
            One design, one owner,{" "}
            {/* One Fraunces italic word, as ever. */}
            <span className="font-serif font-medium italic">forever</span>
          </h2>
        </div>

        <ol className="flex flex-col border-t border-border">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5 border-b border-border py-6 sm:gap-8"
            >
              <span className="font-mono text-caption tracking-[0.08em] text-muted-gray">
                {step.number}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-subheading font-medium text-foreground">
                  {step.name}
                </h3>
                <p className="max-w-[58ch] text-body-sm text-muted-ink">
                  {step.copy}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/signup"
          className="btn-ember group inline-flex w-fit items-center gap-2 px-5 py-2.5 text-body-sm font-medium"
        >
          <span>Build your storefront</span>
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </Link>
      </div>

      {/* The artefact itself. Offset upward on desktop so it breaks the grid
          line instead of sitting in a neat second column. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full rounded-xl border border-ink bg-card p-5 shadow-[var(--shadow-glow)] lg:-mt-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary font-mono text-caption text-primary-foreground">
              SB
            </div>
            <div>
              <p className="text-body-sm font-medium text-foreground">
                @your_handle
              </p>
              {/* Labelled, not implied. Nobody has claimed anything yet, so this
                  is a preview of the product — dressing it up as a real
                  creator's storefront would be inventing a user. */}
              <p className="text-caption text-muted-gray">Example storefront</p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-ink px-2.5 py-0.5 font-mono text-caption text-ink">
            PREVIEW
          </span>
        </div>

        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg border border-border bg-background">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src={PREVIEW_VIDEO_URL} type="video/mp4" />
          </video>
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-4">
            <span className="font-mono text-caption tracking-[0.08em] text-mint-edge uppercase">
              dusk atelier // 1-of-1
            </span>
            <p className="text-body font-medium text-white">
              Neon cyberpunk wave t-shirt
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-ink px-3 py-1.5 text-body-sm font-medium text-ink">
            <Share2 className="size-3.5" strokeWidth={1.5} />
            Share asset
          </span>
          <span className="font-mono text-body-sm text-ink">
            Royalty {ROYALTY_RATE_PERCENT}%
          </span>
        </div>
      </motion.div>
    </section>
  )
}
