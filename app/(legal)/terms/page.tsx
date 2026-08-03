import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The rules for claiming, selling, and using Shirt Bazaar"
      lastUpdated="[Date]"
      sections={[
        {
          heading: "Overview",
          body: (
            <p>
              These terms govern your use of Shirt Bazaar, a marketplace for
              one-of-one, AI-generated t-shirt designs. By creating an
              account or using the service, you agree to these terms.
            </p>
          ),
        },
        {
          heading: "Eligibility",
          body: (
            <p>
              You must be at least 18 years old, or the age of majority
              where you live, to create an account, generate designs, claim
              a design, or make a purchase.
            </p>
          ),
        },
        {
          heading: "Accounts",
          body: (
            <p>
              You&apos;re responsible for keeping your account credentials
              secure and for all activity under your account. Your public
              handle, storefront, and any designs you claim are visible to
              other users and visitors.
            </p>
          ),
        },
        {
          heading: "Generating designs",
          body: (
            <p>
              You can upload style-reference images and prompts to generate
              designs. You&apos;re responsible for making sure any reference
              images you upload are yours to use, or that you have the right
              to use them for this purpose. Generated designs go through
              moderation before they&apos;re shown publicly, and we may
              reject or remove designs that violate the Prohibited Conduct
              section below.
            </p>
          ),
        },
        {
          heading: "Claiming a design",
          body: (
            <ul>
              <li>
                Claiming a design gives you exclusive, first-use ownership of
                that design on the platform, plus your own storefront — a
                shareable page showing the designs you&apos;ve claimed.
              </li>
              <li>
                As the claimant, you earn a royalty on every future resale of
                that design, for as long as it keeps selling, calculated and
                paid out as described at the time of each sale.
              </li>
              <li>
                Resale of a claimed design must happen on-platform. Exporting
                or reproducing a claimed design&apos;s underlying files
                outside Shirt Bazaar for resale elsewhere is not permitted
                and undermines the royalty mechanic this feature depends on.
              </li>
              <li>
                Claims and purchases are final in the sense described in our{" "}
                <a href="/refund-policy">Refund Policy</a> — read it before
                you buy.
              </li>
            </ul>
          ),
        },
        {
          heading: "Payments and fulfillment",
          body: (
            <p>
              Payments are processed by Stripe. Physical orders are produced
              and shipped by a print-on-demand partner; production and
              shipping times vary by product and location. Print-quality
              tiers are described to you by feel and price, not by
              manufacturer — the specific fulfillment provider is not
              disclosed as part of normal use.
            </p>
          ),
        },
        {
          heading: "Intellectual property",
          body: (
            <p>
              You keep whatever rights you already had in images you upload
              as style references, and you grant us a license to use them to
              generate designs for you. Ownership and resale rights in a
              claimed design are governed by the claim mechanic above, not by
              traditional copyright transfer — see [Company Legal
              Name]&apos;s IP policy for the full legal framing of
              AI-generated design ownership in your jurisdiction.
            </p>
          ),
        },
        {
          heading: "Prohibited conduct",
          body: (
            <>
              <p>You may not upload, generate, or do any of the following:</p>
              <ul>
                <li>
                  Upload or generate content that infringes someone else&apos;s
                  copyright, trademark, or other IP rights.
                </li>
                <li>
                  Depict real people without their consent, in a way
                  that&apos;s misleading, defamatory, or exploitative.
                </li>
                <li>
                  Upload or generate content that&apos;s hateful, harassing,
                  sexually explicit, graphically violent, or illegal where
                  you or the platform operates.
                </li>
                <li>
                  Attempt to claim a design that isn&apos;t rightfully
                  available, or manipulate the claim/royalty mechanics.
                </li>
                <li>
                  Use messages to spam, harass, or solicit off-platform
                  payment.
                </li>
                <li>
                  Attempt to circumvent moderation, rate limits, or account
                  restrictions.
                </li>
              </ul>
              <p>
                We may reject or remove violating content, and suspend or
                terminate accounts that violate this section.
              </p>
            </>
          ),
        },
        {
          heading: "Disclaimers and liability",
          body: (
            <p>
              Shirt Bazaar is provided &quot;as is.&quot; We don&apos;t
              guarantee that generated designs, storefronts, or royalty
              payouts will be uninterrupted or error-free. To the extent
              permitted by law, our liability to you is limited to the amount
              you paid us in the 12 months before the claim arose.
            </p>
          ),
        },
        {
          heading: "Termination",
          body: (
            <p>
              You can stop using the service at any time. We may suspend or
              terminate your account for violating these terms or the
              Acceptable Use Policy. Claim ownership and accrued royalty
              obligations survive termination as described in our royalty
              terms.
            </p>
          ),
        },
        {
          heading: "Governing law",
          body: (
            <p>
              These terms are governed by the laws of [Jurisdiction], without
              regard to conflict-of-law principles. Disputes will be
              resolved as described in [Dispute Resolution / Arbitration
              clause — TBD].
            </p>
          ),
        },
        {
          heading: "Changes to these terms",
          body: (
            <p>
              We may update these terms as the service evolves. Material
              changes will be posted here with an updated date above.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              [Company Legal Name], [Address] —{" "}
              <a href="mailto:legal@shirtbazaar.com">legal@shirtbazaar.com</a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
