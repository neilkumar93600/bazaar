import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageLayout } from "@/components/legal/LegalPageLayout"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"
import { DAILY_IMAGE_CAP } from "@/lib/generation/quota"

export const metadata: Metadata = {
  title: "Terms of Service | Shirt Bazaar",
  description:
    "Official binding terms governing account use, AI design generation, 1-of-1 genesis claiming, commercial IP ownership assignment, and custom creator storefronts on Shirt Bazaar.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The binding rules governing design generation, 1-of-1 genesis claiming, commercial IP ownership, and turnkey creator storefronts on Shirt Bazaar."
      metadata={{
        version: "2.4",
        lastUpdated: "January 15, 2026",
        effectiveDate: "January 15, 2026",
        jurisdiction: "Delaware, United States",
        readingTime: "9 min read",
        contactEmail: "legal@shirtbazaar.com",
      }}
      sections={[
        {
          id: "overview",
          number: "01",
          heading: "Acceptance & Overview",
          plainEnglishSummary: [
            "By creating an account, browsing the catalog, generating artwork, or claiming a design, you agree to these legally binding terms.",
            "Shirt Bazaar operates as a combined AI art studio, commercial IP licensing platform, on-demand physical merchandise manufacturer, and automated creator e-commerce ecosystem.",
            "If you do not agree with any provision here, you must immediately discontinue using our services.",
          ],
          searchKeywords: ["agreement", "acceptance", "binding", "contract", "overview", "introduction"],
          content: (
            <>
              <p>
                These Terms of Service (<strong>&quot;Terms&quot;</strong>) constitute a legally binding agreement between you
                (<strong>&quot;User&quot;</strong>, <strong>&quot;Creator&quot;</strong>, <strong>&quot;Buyer&quot;</strong>, or <strong>&quot;you&quot;</strong>)
                and <strong>Shirt Bazaar, Inc.</strong> (<strong>&quot;Shirt Bazaar&quot;</strong>, <strong>&quot;we&quot;</strong>, <strong>&quot;us&quot;</strong>, or <strong>&quot;our&quot;</strong>).
                These Terms govern your access to and utilization of our website, web applications, APIs, smart generation engine, storefront infrastructure,
                and physical product fulfillment services (collectively, the <strong>&quot;Platform&quot;</strong> or <strong>&quot;Services&quot;</strong>).
              </p>
              <p>
                By registering an account, submitting prompts, uploading reference imagery, purchasing or claiming any design, or accessing our marketplace,
                you explicitly acknowledge that you have read, understood, and agreed to be legally bound by these Terms, our{" "}
                <Link href="/privacy">Privacy Policy</Link>, <Link href="/refund-policy">Refund Policy</Link>, and{" "}
                <Link href="/ip-policy">Commercial IP & DMCA Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: "eligibility-accounts",
          number: "02",
          heading: "Eligibility & Account Security",
          plainEnglishSummary: [
            "You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to make purchases or claim designs.",
            "You are solely responsible for maintaining the confidentiality of your authentication credentials.",
            "Your chosen public handle and profile will be visible across the bazaar and on your dedicated creator storefront.",
          ],
          searchKeywords: ["age", "eligibility", "account", "password", "security", "profile", "handle"],
          content: (
            <>
              <p>
                <strong>2.1 Eligibility:</strong> You must be at least 18 years of age, or the legal age of majority in your state, province, or country of residence,
                to establish an account, generate content, claim designs, or execute transactions. By utilizing the Platform, you represent and warrant that you possess
                the legal capacity to enter into a binding contract under applicable law.
              </p>
              <p>
                <strong>2.2 Account Responsibilities:</strong> You agree to provide true, accurate, and complete information during registration.
                You are solely responsible for all actions conducted under your account credentials. You must immediately notify{" "}
                <a href="mailto:security@shirtbazaar.com">security@shirtbazaar.com</a> if you suspect unauthorized access or security breaches.
              </p>
              <p>
                <strong>2.3 Public Identifiers & Handles:</strong> When creating an account, you select a unique public handle (e.g. <code>/creator/yourhandle</code>).
                Shirt Bazaar reserves the right to reclaim, suspend, or reassign usernames that violate registered trademarks, impersonate real persons or brands, or violate our Acceptable Use standards.
              </p>
            </>
          ),
        },
        {
          id: "generation-rules",
          number: "03",
          heading: "AI Generation & Style Reference Uploads",
          plainEnglishSummary: [
            `Every user receives a daily allowance of up to ${DAILY_IMAGE_CAP} AI design generations per 24-hour cycle.`,
            "You must own or have authorized rights to any reference imagery you upload for style conditioning.",
            "Generated designs remain private to your creator studio until you choose to list them in the public bazaar or claim them directly.",
          ],
          searchKeywords: ["ai", "generation", "quota", "daily cap", "prompts", "reference upload", "studio", "listing"],
          content: (
            <>
              <p>
                <strong>3.1 Generation Studio & Quota:</strong> Shirt Bazaar provides cutting-edge generative image synthesis tools allowing creators to produce high-resolution apparel graphics.
                Each authenticated account is allocated a daily generation quota (currently capped at <strong>{DAILY_IMAGE_CAP} generations per 24-hour rolling window</strong>).
                Unused quota does not roll over. We reserve the right to modify quota thresholds to protect computational infrastructure and maintain service availability.
              </p>
              <p>
                <strong>3.2 Style Reference Uploads:</strong> When utilizing image-to-image or visual style conditioning, you warrant that you possess all necessary rights,
                licenses, and consents for any media uploaded. You may not upload third-party copyrighted art, trademarks, private personal portraits, or infringing material.
              </p>
              <p>
                <strong>3.3 Studio Privacy & Listing:</strong> Freshly synthesized designs are stored privately within your account studio. Artwork becomes publicly discoverable in the bazaar
                only when you explicitly publish it or when an authorized claim occurs.
              </p>
            </>
          ),
        },
        {
          id: "genesis-claim",
          number: "04",
          heading: "1-of-1 Genesis Claiming & Commercial IP Assignment",
          plainEnglishSummary: [
            "Claiming a design executes a permanent 1-of-1 genesis drop. A design can be claimed exactly once in history.",
            "When you claim a design, Shirt Bazaar assigns 100% exclusive commercial intellectual property rights to you.",
            "You receive full commercial freedom to merchandise, produce physical runs, license, or sell products featuring the design.",
          ],
          searchKeywords: ["1-of-1", "claim", "genesis", "ownership", "copyright", "commercial rights", "assignment", "ip"],
          content: (
            <>
              <p>
                <strong>4.1 One-of-One Genesis Permanence:</strong> The foundational principle of Shirt Bazaar is true 1-of-1 uniqueness. Once a design is claimed by a user,
                that genesis design is locked permanently to that claimant. No second edition, identical reprint by another user, or duplicated platform asset will ever be minted or made claimable.
              </p>
              <p>
                <strong>4.2 Commercial Rights Assignment:</strong> Upon verified settlement of a claim purchase, Shirt Bazaar grants and assigns to the claimant
                an irrevocable, worldwide, exclusive, royalty-free (subject only to platform platform mechanics herein), and fully transferable commercial license and copyright assignment
                in the underlying graphic work. You own the commercial rights to reproduce, distribute, merchandise, display, and license the artwork.
              </p>
              <p>
                <strong>4.3 Platform Showcase License:</strong> To operate the marketplace and your storefront, you grant Shirt Bazaar a non-exclusive, worldwide, royalty-free license
                to host, index, display, format, and generate mockups of the claimed design on our web properties and marketing materials.
              </p>
              <p>
                For detailed legal definitions regarding AI authorship, jurisdictions, and DMCA protections, consult our{" "}
                <Link href="/ip-policy">Commercial IP & DMCA Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: "creator-storefronts",
          number: "05",
          heading: "Turnkey Creator Storefronts & Merch Automation",
          plainEnglishSummary: [
            "Claiming a design instantly provisions your branded e-commerce storefront at /creator/[yourhandle].",
            "Shirt Bazaar provides automated hosting, 3D mockup generation, and zero-inventory print-on-demand fulfillment.",
            "You are not required to hold physical inventory, negotiate manufacturing deals, or manage warehouse logistics.",
          ],
          searchKeywords: ["storefront", "creator", "merch", "dropshipping", "fulfillment", "custom store", "inventory"],
          content: (
            <>
              <p>
                <strong>5.1 Automated Storefront Provisioning:</strong> Within seconds of completing a claim, our system automatically provisions a dedicated storefront
                accessible at <code>shirtbazaar.com/creator/yourhandle</code>. This storefront showcases your claimed designs with pre-configured apparel mockups, sizing tables, and instant checkout pathways.
              </p>
              <p>
                <strong>5.2 Turnkey Zero-Inventory Architecture:</strong> Shirt Bazaar handles all backend e-commerce operations, including payment gateway orchestration,
                order dispatching, automated print-on-demand fulfillment, packaging, tracking notifications, and tier-1 physical quality control.
              </p>
              <p>
                <strong>5.3 Storefront Governance:</strong> Creators may customize their storefront display name, bio, and social handles. Storefronts must adhere to our
                Content & Moderation Standards. Shirt Bazaar reserves the right to suspend storefronts that propagate deceptive practices or prohibited content.
              </p>
            </>
          ),
        },
        {
          id: "royalties",
          number: "06",
          heading: `Resale Royalties (${ROYALTY_RATE_PERCENT}%) & Platform Accounting`,
          plainEnglishSummary: [
            `Original claimants earn an automatic ${ROYALTY_RATE_PERCENT}% royalty on every future customer purchase of apparel bearing their design.`,
            "Royalties accrue automatically in platform accounting and are tracked on your creator dashboard.",
            "Off-platform file scraping or attempting to circumvent platform royalty mechanics is strictly prohibited.",
          ],
          searchKeywords: ["royalty", "resale", "earnings", "payout", "accounting", "creator revenue"],
          content: (
            <>
              <p>
                <strong>6.1 Continuous Royalty Mechanics:</strong> Whenever a visitor or customer purchases physical apparel featuring a design you claimed,
                you are credited with an ongoing <strong>{ROYALTY_RATE_PERCENT}% royalty</strong> based on the net retail sale price (excluding shipping fees, sales taxes, and duty assessments).
              </p>
              <p>
                <strong>6.2 Platform Accounting & Verification:</strong> All royalty accruals are recorded transparently in our audit ledger and reflected within your Creator Dashboard.
                Payouts are disbursed in accordance with platform payout scheduling, subject to minimum payout thresholds and standard anti-money laundering (AML) and identity verification (KYC) requirements.
              </p>
              <p>
                <strong>6.3 Circumvention Prohibition:</strong> The platform royalty mechanic exists to reward original curatorial taste and artistic direction.
                Exporting print-ready production files to bypass Shirt Bazaar fulfillment while retaining marketplace listings is a material breach of these Terms.
              </p>
            </>
          ),
        },
        {
          id: "payments-billing",
          number: "07",
          heading: "Payments, Pricing & Bolt Gateway Processing",
          plainEnglishSummary: [
            "Payments are securely processed through Bolt and certified PCI-DSS Level 1 payment infrastructure.",
            "We never store your full payment card number or CVV codes on our servers.",
            "All prices are quoted in USD unless local currency conversion is explicitly displayed during checkout.",
          ],
          searchKeywords: ["payment", "bolt", "credit card", "billing", "pricing", "taxes", "currency"],
          content: (
            <>
              <p>
                <strong>7.1 Payment Processing:</strong> All monetary transactions on the Platform are processed through certified third-party payment gateways (including <strong>Bolt</strong>).
                By submitting payment details, you authorize our gateway partners to charge the designated payment method for all order totals, including applicable shipping fees and taxes.
              </p>
              <p>
                <strong>7.2 Pricing Structure:</strong> Prices for garments, claim fees, and premium print options are displayed on product detail pages and confirmed at checkout.
                Shirt Bazaar reserves the right to update product catalog pricing at any time prior to order confirmation.
              </p>
              <p>
                <strong>7.3 Taxes & Customs:</strong> You are responsible for all applicable sales taxes, value-added taxes (VAT), goods and services taxes (GST), customs duties,
                and import tariffs levied by your jurisdiction.
              </p>
            </>
          ),
        },
        {
          id: "fulfillment-delivery",
          number: "08",
          heading: "Print-on-Demand Fulfillment & Shipping",
          plainEnglishSummary: [
            "Every garment is printed on-demand specifically for your order using premium direct-to-garment (DTG) printing.",
            "Production typically takes 2–5 business days, followed by carrier transit times depending on your global destination.",
            "Defective items or misprints are covered under our 14-day reprint guarantee.",
          ],
          searchKeywords: ["fulfillment", "shipping", "delivery", "print on demand", "dtg", "production time"],
          content: (
            <>
              <p>
                <strong>8.1 Custom On-Demand Manufacturing:</strong> Physical apparel products are custom-manufactured on-demand following order confirmation via specialized print facilities.
                Because products are bespoke, production begins promptly after payment clearance.
              </p>
              <p>
                <strong>8.2 Production & Transit Timelines:</strong> Typical production turnaround spans 2 to 5 business days. Standard shipping timelines vary based on shipping destination,
                customs clearance, and postal carrier performance. Estimated delivery windows provided at checkout are estimates and not guarantees.
              </p>
              <p>
                <strong>8.3 Defects & Lost Packages:</strong> If your order arrives damaged, defective, or suffers a misprint, you must notify support within 14 calendar days of delivery as detailed in our{" "}
                <Link href="/refund-policy">Refund Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: "prohibited-conduct",
          number: "09",
          heading: "Prohibited Content & Acceptable Use",
          plainEnglishSummary: [
            "You may not generate or upload hateful, defamatory, sexually explicit, graphically violent, or illegal content.",
            "You may not infringe third-party copyrights, registered trademarks, or likeness rights of living individuals.",
            "Violating accounts face immediate content deletion, permanent suspension, and forfeiture of marketplace privileges.",
          ],
          searchKeywords: ["prohibited", "abuse", "copyright infringement", "hate speech", "moderation", "suspension", "rules"],
          content: (
            <>
              <p>You agree not to engage in, facilitate, or encourage any of the following prohibited activities:</p>
              <ul>
                <li>
                  <strong>Intellectual Property Infringement:</strong> Uploading or prompting artwork that infringes trademarks, brand logos, copyrighted characters, or proprietary designs.
                </li>
                <li>
                  <strong>Hate Speech & Harassment:</strong> Generating content that promotes violence, discrimination, harassment, or hatred against protected groups or individuals.
                </li>
                <li>
                  <strong>Non-Consensual Likeness:</strong> Generating depictions of identifiable real people without their explicit documented consent.
                </li>
                <li>
                  <strong>Explicit & Illicit Media:</strong> Producing pornographic, sexually explicit, excessively graphic, or illegal imagery.
                </li>
                <li>
                  <strong>System Interference:</strong> Circumventing rate limits, exploiting automated scraping bots, injecting malicious code, or interfering with server integrity.
                </li>
                <li>
                  <strong>Marketplace Manipulation:</strong> Engaging in wash trading, artificial claim collusion, or payment fraud.
                </li>
              </ul>
              <p>
                Shirt Bazaar utilizes automated computer-vision moderation alongside human review. We reserve the absolute right to reject, unlist, or purge any content and terminate offending accounts without notice.
              </p>
            </>
          ),
        },
        {
          id: "liability-warranties",
          number: "10",
          heading: "Disclaimers & Limitation of Liability",
          plainEnglishSummary: [
            "The Platform and AI generation services are provided on an 'AS IS' and 'AS AVAILABLE' basis.",
            "Shirt Bazaar's total aggregate liability is capped at the greater of $100 USD or the amount you paid us in the prior 12 months.",
            "We are not liable for indirect, punitive, or consequential damages resulting from platform downtime or third-party carrier delays.",
          ],
          searchKeywords: ["disclaimer", "warranty", "liability", "damages", "limitation", "as is"],
          content: (
            <>
              <p>
                <strong>10.1 Disclaimer of Warranties:</strong> TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, SHIRT BAZAAR AND ITS AFFILIATES, OFFICERS, DIRECTORS,
                AND EMPLOYEES DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                WE MAKE NO REPRESENTATIONS REGARDING UNINTERRUPTED AVAILABILITY OR ERROR-FREE PERFORMANCE OF AI GENERATION MODELS.
              </p>
              <p>
                <strong>10.2 Limitation of Liability:</strong> UNDER NO CIRCUMSTANCES SHALL SHIRT BAZAAR BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL. OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF THESE TERMS SHALL NOT EXCEED THE GREATER OF $100.00 USD
                OR THE TOTAL FEES PAID BY YOU TO SHIRT BAZAAR DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </>
          ),
        },
        {
          id: "disputes-arbitration",
          number: "11",
          heading: "Dispute Resolution, Binding Arbitration & Governing Law",
          plainEnglishSummary: [
            "These Terms are governed by the laws of the State of Delaware, United States.",
            "Disputes will be resolved via binding individual arbitration under the American Arbitration Association (AAA) rules.",
            "You waive any right to participate in class actions or representative jury proceedings.",
          ],
          searchKeywords: ["arbitration", "disputes", "governing law", "delaware", "class action waiver", "legal action"],
          content: (
            <>
              <p>
                <strong>11.1 Governing Law:</strong> These Terms and any dispute arising out of or related to your use of the Platform shall be governed by and construed in accordance
                with the laws of the <strong>State of Delaware, United States</strong>, without giving effect to any principles of conflicts of law.
              </p>
              <p>
                <strong>11.2 Mandatory Binding Arbitration:</strong> Any controversy or claim arising out of or relating to this contract shall be settled by binding individual arbitration
                administered by the <strong>American Arbitration Association (AAA)</strong> in accordance with its Commercial Arbitration Rules. The seat of arbitration shall be Wilmington, Delaware.
              </p>
              <p>
                <strong>11.3 Class Action Waiver:</strong> YOU AND SHIRT BAZAAR AGREE THAT ALL CLAIMS MUST BE BROUGHT IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER
                IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING.
              </p>
            </>
          ),
        },
        {
          id: "amendments-contact",
          number: "12",
          heading: "Modifications, Termination & Official Contact",
          plainEnglishSummary: [
            "We may update these terms periodically; material changes will be announced with updated dates.",
            "You may terminate your account at any time via your account dashboard.",
            "Legal inquiries should be sent to legal@shirtbazaar.com.",
          ],
          searchKeywords: ["amendments", "updates", "termination", "contact", "notice", "address"],
          content: (
            <>
              <p>
                <strong>12.1 Amendments:</strong> We reserve the right to modify these Terms at any time. When material modifications occur, we will post the revised Terms on this page
                with an updated &quot;Last Updated&quot; date and, where appropriate, provide direct notification via email or platform banners.
              </p>
              <p>
                <strong>12.2 Contact Information:</strong> For legal inquiries, formal notices, or corporate communications, contact our legal team:
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs sm:text-sm text-foreground">
                <p><strong>Shirt Bazaar, Inc.</strong></p>
                <p>Attention: Legal Department & Compliance Counsel</p>
                <p>1209 Orange Street, Wilmington, DE 19801, United States</p>
                <p className="mt-2">
                  Email: <a href="mailto:legal@shirtbazaar.com" className="font-semibold underline">legal@shirtbazaar.com</a>
                </p>
              </div>
            </>
          ),
        },
      ]}
    />
  )
}
