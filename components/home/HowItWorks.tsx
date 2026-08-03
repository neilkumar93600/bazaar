"use client"

import { Stagger, StaggerItem } from "@/components/ui/motion"
import { ShieldCheck, Store, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"

const STEPS = [
  {
    number: "01",
    icon: ShieldCheck,
    name: "Claim 1-of-1",
    copy: "Browse vibe columns. Claim the design that speaks to you — once claimed, it's exclusively yours forever.",
    color: "from-ember-orange/25 to-deep-ember/10 text-ember-orange",
  },
  {
    number: "02",
    icon: Store,
    name: "Auto Storefront",
    copy: "Claiming automatically provisions your personal shareable storefront. Show off your taste and share your link.",
    color: "from-molten-amber/25 to-ember-orange/10 text-molten-amber",
  },
  {
    number: "03",
    icon: RefreshCw,
    name: "Earn Royalties",
    copy: "Every future resale of a design you claimed pays you an automatic royalty. Your taste generates income.",
    color: "from-gold-leaf/25 to-molten-amber/10 text-gold-leaf",
  },
]

export function HowItWorks() {
  return (
    <section className="flex flex-col gap-10 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-2 text-center">
        <span className="text-xs font-bold tracking-widest text-ember-orange uppercase">
          The Three-Step Core Loop
        </span>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground italic sm:text-4xl">
          How Shirt Bazaar Works
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          From first discovery to lifetime resale earnings — built for
          taste-makers.
        </p>
      </div>

      <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon
          return (
            <StaggerItem
              key={step.number}
              className="group glass-surface glass-surface-interactive relative flex flex-col justify-between gap-6 rounded-3xl border bg-card p-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-black text-muted-foreground/30 transition-colors group-hover:text-primary">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {step.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-transform group-hover:translate-x-1"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>
    </section>
  )
}
