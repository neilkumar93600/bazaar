"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section
      id="auro-header-section"
      className="relative min-h-[700px] w-full overflow-hidden bg-pitch select-none lg:h-[100dvh] lg:min-h-[850px]"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none h-full w-full object-cover"
        >
          <source
            src="https://cdn.jiro.build/Jahid/Random/Auro%20Ai/All%20Images/header%20BG%20auro%20ai.mp4"
            type="video/mp4"
          />
        </video>
        {/* Two washes: a flat darkener so Bone text clears contrast on every
            frame of the video, then the orange bloom on top of it. */}
        <div className="pointer-events-none absolute inset-0 bg-pitch/70" />
        <div className="pointer-events-none absolute inset-0 bg-hero-atmosphere" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between px-6 pt-[110px] pb-[32px] md:px-[48px] md:pt-[130px] [@media(min-width:1440px)]:px-[64px]">
        <div className="h-0 max-h-[64px] min-h-[16px] flex-grow-[1] md:min-h-[32px]" />

        {/* Centered Main Content */}
        <div className="mx-auto flex w-full max-w-[920px] flex-col items-center px-4 text-center">
          {/* Eyebrow Tagline */}
          <p className="mb-3 text-center text-[15px] leading-[140%] font-normal tracking-[-0.4px] text-foreground/70 select-none sm:text-[18px] lg:text-[20px]">
            One prompt. One shirt. One owner.
          </p>

          {/* Main H1 Headline — font treatment is frozen (docs/DESIGN.md §5) */}
          <h1 className="mt-[8px] w-full text-center font-serif text-[44px] leading-[102%] font-medium tracking-[-1.5px] text-foreground italic sm:text-[56px] sm:tracking-[-3px] md:text-[72px] lg:text-[88px] lg:tracking-[-5px]">
            AI Shirts That Exist Exactly Once
          </h1>

          {/* Subtitle */}
          <p className="mt-[16px] w-full max-w-[720px] text-center text-[15px] leading-[140%] font-normal tracking-[-0.4px] text-foreground/75 sm:text-[17px] md:mt-[24px] md:text-[19px] lg:text-[21px]">
            Shirt Bazaar turns a single prompt into 1-of-1 AI apparel only one
            person on earth can own. Claim the design, get an instant
            storefront, and earn a royalty every time it resells.
          </p>

          {/* Buttons Group */}
          <div className="mt-[28px] flex flex-col items-center gap-[14px] sm:flex-row md:mt-[40px]">
            <Link
              href="/dashboard/create"
              className="btn-ember group flex h-[46px] cursor-pointer items-center justify-center gap-[12px] rounded-full px-[22px] md:h-[50px] md:px-[28px]"
            >
              <span className="relative block h-[1.4em] overflow-hidden text-center text-[16px] leading-[1.4em] font-medium tracking-[-0.4px] md:text-[18px] lg:text-[20px]">
                <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
                  Generate Your Vibe
                </span>
                <span className="absolute top-full left-0 block whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
                  Generate Your Vibe
                </span>
              </span>
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1.5 md:h-[20px] md:w-[20px]" />
            </Link>

            <Link
              href="#vibe-feed"
              className="glass-panel group relative flex h-[46px] cursor-pointer items-center justify-center gap-[12px] overflow-hidden rounded-full border px-[22px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] active:scale-[0.98] md:h-[50px] md:px-[28px]"
            >
              <span className="relative block h-[1.4em] overflow-hidden text-center text-[16px] leading-[1.4em] font-medium tracking-[-0.4px] text-foreground md:text-[18px] lg:text-[20px]">
                <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
                  Explore Bazaar
                </span>
                <span className="absolute top-full left-0 block whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
                  Explore Bazaar
                </span>
              </span>
            </Link>
          </div>
        </div>

        <div className="h-0 max-h-[257px] min-h-[48px] flex-grow-[4] md:min-h-[96px]" />

        {/* Bottom Proof Bar */}
        <div className="mx-auto flex w-full max-w-[1022px] flex-col items-center gap-[16px]">
          {/* Not a heading — proof copy. An <h3> here skipped a level under the h1. */}
          <p className="text-center text-[14px] leading-[140%] font-medium tracking-[-0.4px] text-foreground/70 sm:text-[16px] lg:text-[18px]">
            Trusted by 837k+ creators & fashion enthusiasts
          </p>
        </div>
      </div>
    </section>
  )
}
