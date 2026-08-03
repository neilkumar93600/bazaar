import { Lock, RefreshCw, Shield, Store } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/ui/motion"

const ITEMS = [
  {
    icon: Shield,
    label: "One-of-one",
    copy: "Every claim is exclusive. No reprints, no duplicates.",
  },
  {
    icon: RefreshCw,
    label: "Resale royalties",
    copy: "Earn a cut every time your design resells.",
  },
  {
    icon: Lock,
    label: "Secure checkout",
    copy: "Stripe-secured payments, every order.",
  },
  {
    icon: Store,
    label: "Your storefront",
    copy: "Claim a design, get a shareable storefront instantly.",
  },
]

export function TrustStrip() {
  return (
    <section className="w-full bg-secondary">
      <Stagger className="mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4 sm:px-6 sm:py-12 lg:px-8">
        {ITEMS.map(({ icon: Icon, label, copy }) => (
          <StaggerItem
            key={label}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Icon className="size-6 text-primary" />
            <span className="text-body font-medium text-foreground">
              {label}
            </span>
            <span className="text-body-sm text-muted-foreground">{copy}</span>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
