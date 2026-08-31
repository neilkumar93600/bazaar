import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageLayout } from "@/components/legal/LegalPageLayout"

export const metadata: Metadata = {
  title: "Refund & Reprint Policy | Shirt Bazaar",
  description:
    "Official refund, reprint, and defect replacement policy for custom print-on-demand merchandise and 1-of-1 genesis claims on Shirt Bazaar.",
  alternates: { canonical: "/refund-policy" },
}

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund & Reprint Policy"
      subtitle="Transparent guidelines on custom print-on-demand manufacturing, 14-day defect reprints, lost parcel resolutions, and 1-of-1 claim terms."
      metadata={{
        version: "2.2",
        lastUpdated: "January 15, 2026",
        effectiveDate: "January 15, 2026",
        jurisdiction: "Delaware, United States & Global Consumer Standards",
        readingTime: "5 min read",
        contactEmail: "support@shirtbazaar.com",
      }}
      sections={[
        {
          id: "overview-pod",
          number: "01",
          heading: "Custom Print-on-Demand Model",
          plainEnglishSummary: [
            "Every garment purchased on Shirt Bazaar is bespoke and printed on-demand specifically for you after your order is confirmed.",
            "Because physical items are custom-manufactured and 1-of-1 designs are irreversibly claimed, orders cannot be cancelled once production begins.",
            "We stand behind the physical print quality of our garments with our 14-day defect resolution guarantee.",
          ],
          searchKeywords: ["overview", "print on demand", "custom apparel", "cancellation window", "bespoke"],
          content: (
            <>
              <p>
                Every physical apparel item purchased on <strong>Shirt Bazaar</strong> is individually crafted using state-of-the-art Direct-to-Garment (DTG) printing technologies.
                Unlike traditional mass-retailers stocking pre-printed warehouse inventory, our products do not exist in physical form until an order is placed.
              </p>
              <p>
                Because production commences rapidly following payment authorization, standard return policies for off-the-shelf goods do not apply.
                However, we are fully committed to product excellence and guarantee complete resolution for manufacturing defects, damaged shipments, or incorrect deliveries.
              </p>
            </>
          ),
        },
        {
          id: "14-day-guarantee",
          number: "02",
          heading: "14-Day Free Reprint & Defect Guarantee",
          plainEnglishSummary: [
            "If your shirt arrives damaged, defective, misprinted, or in the wrong size/style from what you ordered, we will send a 100% free reprint or full refund.",
            "You must notify support within 14 calendar days of confirmed delivery with photos of the issue.",
            "You generally do not need to ship the defective garment back.",
          ],
          searchKeywords: ["14 day guarantee", "misprint", "damage", "defective", "reprint", "replacement", "photos"],
          content: (
            <>
              <p>
                We provide a comprehensive <strong>14-Day Free Reprint Guarantee</strong> covering the following manufacturing and fulfillment errors:
              </p>
              <ul>
                <li><strong>Print Quality Flaws:</strong> Significant ink smearing, peeling, graphical distortion, wrong placement, or incorrect color profile rendering.</li>
                <li><strong>Garment Defects:</strong> Tears, holes, broken stitching, or fabric blemishes present upon unboxing.</li>
                <li><strong>Fulfillment Errors:</strong> Receiving the incorrect design, wrong size, or incorrect garment color compared to your verified order confirmation.</li>
                <li><strong>In-Transit Damage:</strong> Products crushed, ripped, or damaged during postal transit.</li>
              </ul>
              <p>
                When a verified defect occurs, you have the option to receive a <strong>complimentary reprint rush-shipped to your address</strong> or a{" "}
                <strong>full refund</strong> to your original payment method.
              </p>
            </>
          ),
        },
        {
          id: "lost-delayed-shipments",
          number: "03",
          heading: "Lost, Stolen & Delayed Shipments",
          plainEnglishSummary: [
            "If tracking indicates your package is lost in transit, or has not updated past the estimated delivery window, we will rush a free replacement.",
            "For packages marked 'Delivered' but missing, please check with neighbors/building managers before filing a stolen package inquiry.",
          ],
          searchKeywords: ["lost package", "tracking", "stolen", "delayed shipment", "carrier issue"],
          content: (
            <>
              <p>
                <strong>3.1 Lost in Transit:</strong> If your tracking code shows no movement for more than 7 consecutive business days past the carrier&apos;s estimated delivery date,
                the parcel is deemed lost in transit. We will immediately initiate an expedited replacement print and reshipment at zero cost to you.
              </p>
              <p>
                <strong>3.2 Delivered but Missing:</strong> If a package is marked &quot;Delivered&quot; by the postal carrier but cannot be located, we advise waiting 24 hours
                (carriers frequently scan ahead) and checking with household members or building reception. If still missing, contact our support desk for carrier claims assistance.
              </p>
            </>
          ),
        },
        {
          id: "claim-purchases",
          number: "04",
          heading: "1-of-1 Genesis Claims & Digital IP Rights",
          plainEnglishSummary: [
            "A 1-of-1 Genesis Claim confers permanent, exclusive commercial IP rights and provisions your dedicated creator storefront.",
            "Because digital ownership rights and commercial licenses attach immediately upon transaction settlement, the digital claim fee portion is non-refundable.",
            "If the physical shirt included in the claim bundle has a defect, it is 100% covered under our free reprint guarantee.",
          ],
          searchKeywords: ["genesis claim", "ip ownership", "digital rights", "non refundable", "storefront", "license fee"],
          content: (
            <>
              <p>
                When you execute a <strong>1-of-1 Genesis Claim</strong>, you purchase a combined bundle: (a) exclusive permanent commercial intellectual property assignment,
                (b) instant automated provisioning of your creator storefront at <code>/creator/yourhandle</code>, (c) ongoing {` `}
                <Link href="/terms">resale royalty rights</Link>, and (d) a physical genesis specimen garment.
              </p>
              <p>
                Because commercial IP ownership and storefront assets transfer irrevocably upon payment confirmation, the digital claim component cannot be refunded, reversed, or unwound.
                Any physical specimen garment included in the claim bundle remains fully protected by our 14-Day Free Reprint Guarantee.
              </p>
            </>
          ),
        },
        {
          id: "buyer-preference",
          number: "05",
          heading: "Sizing & Buyer's Remorse (Final Sale)",
          plainEnglishSummary: [
            "Because each garment is made on demand, returns or exchanges for buyer preference (e.g. changing your mind on design or ordering the wrong size) are not supported.",
            "Please consult our garment size guides and fit specifications before completing checkout.",
          ],
          searchKeywords: ["final sale", "sizing chart", "buyer remorse", "exchange", "preference"],
          content: (
            <>
              <p>
                Because each item is custom printed on demand, we cannot accept returns or issue refunds due to buyer&apos;s remorse, change of mind,
                or ordering an incorrect size if the item matches the size specifications ordered.
              </p>
              <p>
                We provide detailed sizing charts (chest width, body length, and fit guidelines) on all product pages. We encourage careful review of measurements prior to finalizing your order.
              </p>
            </>
          ),
        },
        {
          id: "how-to-request",
          number: "06",
          heading: "Step-by-Step Resolution Process",
          plainEnglishSummary: [
            "1. Take 2–3 clear photos showing the defect, garment label, and print flaw.",
            "2. Email support@shirtbazaar.com with your Order # and description of the issue.",
            "3. Our support team will review and approve your free reprint or refund within 1–2 business days.",
          ],
          searchKeywords: ["how to request", "reprint steps", "support email", "ticket", "resolution", "sla"],
          content: (
            <>
              <p>To request a reprint or refund for a defective order, follow these simple steps:</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-[15px]">
                <li>
                  <strong>Capture Photographic Evidence:</strong> Take 2–3 well-lit photos showing the defect (e.g. print flaw, fabric defect, or the garment tag showing the received size).
                </li>
                <li>
                  <strong>Submit Your Request:</strong> Send an email to <a href="mailto:support@shirtbazaar.com">support@shirtbazaar.com</a> with the subject line <code>Order #[YourOrderNumber] - Defect Resolution</code>.
                </li>
                <li>
                  <strong>Rapid Evaluation:</strong> Our customer care team reviews all requests within <strong>24 to 48 business hours</strong>.
                </li>
                <li>
                  <strong>Fulfillment:</strong> Upon verification, your free replacement is queued into immediate production with expedited shipping, or your refund is credited within 3–5 business days.
                </li>
              </ol>
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-xs sm:text-sm text-foreground">
                <p><strong>Customer Care & Order Inquiries</strong></p>
                <p>Email: <a href="mailto:support@shirtbazaar.com" className="font-semibold underline">support@shirtbazaar.com</a></p>
                <p>Response Time SLA: Within 24 hours (Monday – Friday)</p>
              </div>
            </>
          ),
        },
      ]}
    />
  )
}
