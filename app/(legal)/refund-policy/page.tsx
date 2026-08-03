import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      subtitle="When you can get a reprint, refund, or neither"
      lastUpdated="[Date]"
      sections={[
        {
          heading: "Overview",
          body: (
            <p>
              Every order on Shirt Bazaar is a custom, print-on-demand
              product made specifically for you after you order it. Because
              of that, our refund policy is more limited than for
              off-the-shelf goods.
            </p>
          ),
        },
        {
          heading: "Final sale",
          body: (
            <p>
              Once production starts, orders can&apos;t be canceled and are
              not eligible for a refund or exchange for reasons of preference
              — for example, changing your mind about size, placement, or
              the design itself after production has begun.
            </p>
          ),
        },
        {
          heading: "Defects and mis-prints",
          body: (
            <p>
              If your order arrives damaged, defective, or significantly
              different from what you ordered (wrong design, wrong size,
              print error), contact us within 14 days of delivery at{" "}
              <a href="mailto:support@shirtbazaar.com">
                support@shirtbazaar.com
              </a>{" "}
              with photos of the issue. We&apos;ll arrange a reprint or
              refund at no cost to you.
            </p>
          ),
        },
        {
          heading: "Lost or undelivered orders",
          body: (
            <p>
              If tracking shows your order as delivered but you didn&apos;t
              receive it, or it&apos;s been significantly delayed past the
              estimated delivery window, contact support and we&apos;ll
              investigate with our fulfillment partner and make it right —
              reprint, reship, or refund, depending on the situation.
            </p>
          ),
        },
        {
          heading: "Claim purchases",
          body: (
            <p>
              Claiming a design is a purchase like any other order and
              follows this same policy for the physical product. The
              exclusive-ownership and royalty aspects of a claim (see our{" "}
              <a href="/terms">Terms of Service</a>) are not refundable
              separately from the underlying order.
            </p>
          ),
        },
        {
          heading: "How to request a refund",
          body: (
            <p>
              Email{" "}
              <a href="mailto:support@shirtbazaar.com">
                support@shirtbazaar.com
              </a>{" "}
              with your order number and the issue. We aim to respond within
              [X business days].
            </p>
          ),
        },
      ]}
    />
  );
}
