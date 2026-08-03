"use client"

import Link from "next/link"
import { Share2, Trophy, ArrowRight, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

const PREVIEW_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4"

export function ProofSocialStrip() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-ash-ember p-6 shadow-[var(--shadow-card)] sm:p-10 lg:p-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Column Text & Feature Bullets */}
        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ember-orange/30 bg-ember-orange/10 px-3.5 py-1.5 text-xs font-bold text-ember-orange">
            <Trophy className="h-3.5 w-3.5" />
            <span>Proof of Claim & Share Engine</span>
          </div>

          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground italic sm:text-4xl">
            Claim it once. Post it anywhere. Earn forever.
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            The instant you claim a design, Shirt Bazaar auto-generates high-res
            ready-to-post share cards formatted for Instagram, TikTok, and X,
            while deploying your personal storefront URL.
          </p>

          <div className="flex flex-col gap-3.5 pt-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-leaf/15 text-xs font-bold text-gold-leaf">
                ✓
              </div>
              <p className="text-xs text-foreground sm:text-sm">
                <strong className="font-semibold">
                  Auto-Generated Share Cards:
                </strong>{" "}
                Instant 1:1 and 9:16 social assets with your claim timestamp.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-molten-amber/15 text-xs font-bold text-molten-amber">
                ✓
              </div>
              <p className="text-xs text-foreground sm:text-sm">
                <strong className="font-semibold">
                  Personal Storefront Link:
                </strong>{" "}
                Share{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  bazaar.app/creator/yourhandle
                </code>{" "}
                as proof of ownership.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ember-orange/15 text-xs font-bold text-ember-orange">
                ✓
              </div>
              <p className="text-xs text-foreground sm:text-sm">
                <strong className="font-semibold">
                  Automated Resale Royalty:
                </strong>{" "}
                Collect 10% on every secondary market trade of your claimed
                design.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/signup"
              className="btn-ember inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold hover:scale-105"
            >
              <span>Build Your Storefront</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Column Interactive Social Card Preview */}
        <div className="relative flex justify-center lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-pitch p-5 text-foreground shadow-[var(--shadow-card)]"
          >
            {/* Header Badge */}
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forge-glow text-xs font-bold text-background">
                  SB
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    @alex_vibe
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Verified Claim Storefront
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-ember-orange/40 bg-ember-orange/20 px-2.5 py-0.5 text-[10px] font-bold text-ember-orange">
                CLAIMED #084
              </span>
            </div>

            {/* Design Video Preview Frame */}
            <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl border border-border bg-graphite">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover opacity-80"
              >
                <source src={PREVIEW_VIDEO_URL} type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-pitch/80 via-transparent to-transparent p-4">
                <span className="font-mono text-[10px] tracking-widest text-ember-orange uppercase">
                  DUSK ATELIER // 1-OF-1
                </span>
                <p className="text-sm font-bold text-foreground">
                  Neon Cyberpunk Wave T-Shirt
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-gunmetal"
                >
                  <Share2 className="h-3.5 w-3.5 text-ember-orange" />
                  <span>Share Asset</span>
                </button>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-molten-amber">
                <span>Royalty: 10%</span>
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
