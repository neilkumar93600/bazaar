import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="What we collect, why, and who we share it with"
      lastUpdated="[Date]"
      sections={[
        {
          heading: "Overview",
          body: (
            <p>
              This policy explains what information Shirt Bazaar
              (&quot;we&quot;, &quot;us&quot;) collects when you use the
              marketplace, why we collect it, and the choices you have.
            </p>
          ),
        },
        {
          heading: "Information we collect",
          body: (
            <ul>
              <li>
                <strong>Account information:</strong>{" "}
                email address and authentication data, plus your public
                profile — handle, display name, and avatar.
              </li>
              <li>
                <strong>Style reference uploads:</strong>{" "}
                images you upload to personalize what gets generated for you.
              </li>
              <li>
                <strong>Generated and claimed designs:</strong>{" "}
                the designs produced from your prompts and reference uploads,
                and records of which designs you&apos;ve claimed.
              </li>
              <li>
                <strong>Order and shipping information:</strong>{" "}
                shipping address, size/placement choices, and order status
                when you purchase a design. We do not store your full card
                details — payments are processed by our payment provider
                (Bolt).
              </li>
              <li>
                <strong>Messages:</strong>{" "}
                messages you send to other users through the platform&apos;s
                inbox.
              </li>
              <li>
                <strong>Usage data:</strong>{" "}
                standard technical data (IP address, device/browser type,
                pages visited) collected automatically to keep the service
                secure and working.
              </li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <ul>
              <li>To generate designs from your prompts and reference uploads.</li>
              <li>
                To operate claims, storefronts, orders, fulfillment, and
                royalty payouts.
              </li>
              <li>To provide account access, customer support, and messaging.</li>
              <li>
                To detect fraud, abuse, and content that violates our
                platform policies.
              </li>
              <li>To comply with legal obligations.</li>
            </ul>
          ),
        },
        {
          heading: "Who we share it with",
          body: (
            <>
              <p>We share data only where needed to run the service:</p>
              <ul>
                <li>
                  <strong>Payment processing:</strong>{" "}
                  Bolt, which handles your payment details directly — we
                  never see or store your full card number.
                </li>
                <li>
                  <strong>Fulfillment:</strong>{" "}
                  a print-on-demand partner receives your shipping address,
                  size, and the print-ready design file needed to produce and
                  ship your order. We don&apos;t name our fulfillment
                  partner(s) publicly, but you can request this information —
                  see Your Rights below.
                </li>
                <li>
                  <strong>Infrastructure providers:</strong>{" "}
                  our hosting, database, and authentication providers, who
                  process data on our behalf under contract.
                </li>
                <li>
                  We do not sell your personal information, and we do not
                  share reference uploads or generated designs with third
                  parties except as described above.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Data retention",
          body: (
            <p>
              We keep account, order, and claim data for as long as your
              account is active plus a reasonable period after for legal,
              tax, and dispute purposes — claim and royalty records are kept
              indefinitely, since a claim can generate royalty payouts for as
              long as a design keeps selling. You can request deletion of
              your account and personal data subject to those legal retention
              needs (see Your Rights).
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              Depending on where you live, you may have the right to access,
              correct, export, or delete your personal information, and to
              object to or restrict certain processing. To exercise any of
              these rights, contact us at{" "}
              <a href="mailto:privacy@shirtbazaar.com">
                privacy@shirtbazaar.com
              </a>
              .
            </p>
          ),
        },
        {
          heading: "Children",
          body: (
            <p>
              Shirt Bazaar is not directed to children, and we do not
              knowingly collect personal information from anyone under 13 (or
              the minimum age required by your local law).
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              We may update this policy as the service changes. Material
              changes will be posted here with an updated date above.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about this policy: [Company Legal Name], [Address] —{" "}
              <a href="mailto:privacy@shirtbazaar.com">
                privacy@shirtbazaar.com
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
