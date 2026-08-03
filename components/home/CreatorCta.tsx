import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/motion"

export function CreatorCta() {
  return (
    <section className="w-full bg-pitch">
      <Reveal className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="font-serif text-heading-lg text-foreground italic">
          List it. Sell it. Earn forever.
        </h2>
        <p className="max-w-lg text-body text-muted-foreground">
          Every resale of your claimed design pays you a royalty —
          automatically, forever.
        </p>
        <Button size="lg" variant="ember" render={<Link href="/signup" />}>
          Start creating
        </Button>
      </Reveal>
    </section>
  )
}
