import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageLayout } from "@/components/legal/LegalPageLayout"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"

export const metadata: Metadata = {
  title: "Commercial IP & DMCA Policy | Shirt Bazaar",
  description:
    "Official Commercial Intellectual Property, AI Authorship Assignment, Trademark, and DMCA Copyright Takedown Policy for Shirt Bazaar.",
  alternates: { canonical: "/ip-policy" },
}

export default function IpPolicyPage() {
  return (
    <LegalPageLayout
      title="Commercial IP & DMCA Policy"
      subtitle="Complete legal framing for 100% commercial IP rights assignment on 1-of-1 claims, AI-generated design ownership, and formal DMCA notice procedures."
      metadata={{
        version: "2.5",
        lastUpdated: "January 15, 2026",
        effectiveDate: "January 15, 2026",
        jurisdiction: "Delaware, United States & 17 U.S.C. § 512 (DMCA)",
        readingTime: "8 min read",
        contactEmail: "legal@shirtbazaar.com",
      }}
      sections={[
        {
          id: "commercial-assignment",
          number: "01",
          heading: "100% Commercial Copyright & IP Assignment",
          plainEnglishSummary: [
            "When you claim a 1-of-1 genesis design, Shirt Bazaar transfers and assigns 100% exclusive commercial intellectual property rights to you.",
            "You have complete legal authority to sell shirts on your automated storefront, manufacture products independently, license the artwork, or adapt the design for commercial ventures.",
            "Unlike traditional print-on-demand where you are merely an affiliate, on Shirt Bazaar you are the verified commercial IP owner.",
          ],
          searchKeywords: ["commercial assignment", "copyright transfer", "100% rights", "ownership", "exclusive license", "merchandising"],
          content: (
            <>
              <p>
                <strong>1.1 Exclusive Commercial Assignment:</strong> Upon confirmed completion of a 1-of-1 Genesis Claim transaction, <strong>Shirt Bazaar, Inc.</strong> irrevocably
                transfers, assigns, and conveys to the claimant all right, title, and commercial interest, including all applicable copyright and exploitation rights,
                in and to the visual graphic artwork comprising the claimed design.
              </p>
              <p>
                <strong>1.2 Scope of Commercial Exploitation:</strong> As the sole commercial rights holder, you are legally entitled to:
              </p>
              <ul>
                <li>Distribute and monetize physical merchandise through your automated Shirt Bazaar creator storefront (<code>/creator/yourhandle</code>).</li>
                <li>Manufacture, distribute, and sell apparel, prints, accessories, or media containing the design through external third-party channels.</li>
                <li>Sub-license, assign, or sell the intellectual property rights to commercial brands or partners without platform clawbacks.</li>
                <li>Receive the continuous <strong>{ROYALTY_RATE_PERCENT}% platform resale royalty</strong> on all future apparel printed through the marketplace.</li>
              </ul>
              <p>
                <strong>1.3 Platform Showcase License:</strong> To facilitate the display, promotion, and on-demand fulfillment of your design, you grant Shirt Bazaar a non-exclusive,
                royalty-free, worldwide license to host, format, generate digital mockups of, and index the artwork across our applications and promotional materials.
              </p>
            </>
          ),
        },
        {
          id: "ai-legal-framing",
          number: "02",
          heading: "AI Generation Legal Framing & Authorship",
          plainEnglishSummary: [
            "We provide generative AI tools that synthesize unique graphical outputs based on your creative prompts and style curation.",
            "Shirt Bazaar disclaims any proprietary claim over the output generated from your prompts, conveying all platform-held rights directly to the claimant.",
            "Users must understand the evolving nature of AI copyright laws globally and ensure their prompts do not replicate existing copyrighted characters.",
          ],
          searchKeywords: ["ai copyright", "generative ai", "authorship", "prompts", "uspto", "copyright office"],
          content: (
            <>
              <p>
                <strong>2.1 Generative Model Output:</strong> Artwork produced through Shirt Bazaar is synthesized via computational machine learning models conditioned
                on user-directed text prompts, style reference tokens, and artistic hyperparameters. Shirt Bazaar makes no claim of platform monopoly over the generated outputs,
                and acts solely as the technical facilitator.
              </p>
              <p>
                <strong>2.2 Jurisdiction & Statutory Framework:</strong> Copyright protectability of generative AI outputs is governed by the laws of your applicable jurisdiction
                (including guidelines from the United States Copyright Office and international copyright treaties). To the fullest extent legally permissible,
                all rights held by Shirt Bazaar in the output are assigned exclusively to the claimant.
              </p>
            </>
          ),
        },
        {
          id: "user-uploads-warranties",
          number: "03",
          heading: "Style Reference Uploads & User Warranties",
          plainEnglishSummary: [
            "You represent and warrant that you own or have legal authorization for any reference image you upload.",
            "You may not upload third-party logos, trademarked cartoon characters, or copyrighted photographs as reference inputs.",
            "You agree to indemnify Shirt Bazaar against any third-party copyright claims resulting from your uploads or prompts.",
          ],
          searchKeywords: ["warranties", "reference uploads", "infringement", "indemnification", "user liability"],
          content: (
            <>
              <p>
                When uploading visual media or submitting prompts to our generation studio, you expressly represent and warrant that:
              </p>
              <ul>
                <li>You possess all necessary ownership, licenses, and legal permissions to utilize and process the uploaded media.</li>
                <li>Your uploads and prompts do not infringe, misappropriate, or violate any copyright, trademark, patent, trade secret, or privacy right of any third party.</li>
                <li>Your inputs do not intentionally replicate or create confusingly similar imitations of registered third-party trademarks or proprietary character franchises.</li>
              </ul>
              <p>
                You agree to defend, indemnify, and hold harmless Shirt Bazaar, Inc. and its directors, officers, and employees against any third-party claims, damages,
                or legal fees arising from your breach of these intellectual property warranties.
              </p>
            </>
          ),
        },
        {
          id: "trademarks-branding",
          number: "04",
          heading: "Shirt Bazaar Trademarks & Platform Branding",
          plainEnglishSummary: [
            "The Shirt Bazaar name, logo, mascot graphics, and website design are proprietary trademarks of Shirt Bazaar, Inc.",
            "You may use 'Available on Shirt Bazaar' badges to promote your creator storefront.",
            "You may not use our brand assets in a manner that falsely implies corporate endorsement or co-ownership of our platform.",
          ],
          searchKeywords: ["trademarks", "branding", "logo", "badge", "brand guidelines", "proprietary"],
          content: (
            <>
              <p>
                <strong>Shirt Bazaar</strong>, the Shirt Bazaar logo, custom UI motifs, and related brand identifiers are protected trademarks and trade dress of{" "}
                <strong>Shirt Bazaar, Inc.</strong> Creators and storefront operators are permitted to use official &quot;Claimed on Shirt Bazaar&quot; or &quot;Buy on Shirt Bazaar&quot;
                badges solely for linking to and promoting their authorized creator storefronts.
              </p>
              <p>
                You may not register domain names, social media handles, or business entities that incorporate &quot;Shirt Bazaar&quot; or confusingly similar marks without prior written authorization.
              </p>
            </>
          ),
        },
        {
          id: "dmca-takedown-notice",
          number: "05",
          heading: "DMCA Takedown Notice Procedure (17 U.S.C. § 512)",
          plainEnglishSummary: [
            "We respect intellectual property rights and respond promptly to formal DMCA takedown notices.",
            "If you believe artwork on Shirt Bazaar infringes your copyright, send a formal written notice containing the 6 required statutory elements to legal@shirtbazaar.com.",
          ],
          searchKeywords: ["dmca", "takedown", "copyright infringement", "512", "notice requirements", "infringing content"],
          content: (
            <>
              <p>
                In accordance with the Digital Millennium Copyright Act (<strong>17 U.S.C. § 512</strong>), Shirt Bazaar maintains a formal procedure for copyright owners
                to report alleged infringement. If you believe your copyrighted work has been copied and made available on the Platform in a manner that constitutes infringement,
                please provide our Designated Copyright Agent with a written notice containing:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-[15px]">
                <li>A physical or electronic signature of a person authorized to act on behalf of the copyright owner.</li>
                <li>Identification of the copyrighted work claimed to have been infringed (or a representative list if multiple works are covered).</li>
                <li>Identification of the material claimed to be infringing, with specific URL links (e.g. <code>https://shirtbazaar.com/design/[id]</code>) enabling us to locate the content.</li>
                <li>Contact information sufficient to permit us to contact you (address, telephone number, and valid email address).</li>
                <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
                <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</li>
              </ol>
            </>
          ),
        },
        {
          id: "dmca-counter-notice",
          number: "06",
          heading: "DMCA Counter-Notification Process",
          plainEnglishSummary: [
            "If your design was removed due to a DMCA notice and you believe this was in error or misidentification, you may submit a formal counter-notice.",
            "Upon receiving a valid counter-notice, we will forward it to the claimant and may restore the design within 10–14 business days unless legal action is filed.",
          ],
          searchKeywords: ["counter notice", "dmca counter", "restoration", "misidentification", "10-14 days"],
          content: (
            <>
              <p>
                If you believe your content was removed or disabled as a result of mistake or misidentification, you may file a written Counter-Notification with our
                Designated Copyright Agent containing:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-[15px]">
                <li>Your physical or electronic signature.</li>
                <li>Identification of the material that has been removed or disabled, and the location where the material appeared before removal.</li>
                <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
                <li>Your name, address, telephone number, and email address.</li>
                <li>A statement consenting to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or Delaware if outside the US), and that you will accept service of process from the complainant.</li>
              </ol>
            </>
          ),
        },
        {
          id: "repeat-infringer",
          number: "07",
          heading: "Repeat Infringer Policy",
          plainEnglishSummary: [
            "We maintain a strict repeat infringer policy.",
            "Accounts that receive multiple validated DMCA notices will be permanently banned, and their storefronts disabled.",
          ],
          searchKeywords: ["repeat infringer", "account ban", "termination", "three strikes", "suspension"],
          content: (
            <>
              <p>
                Pursuant to Section 512(i)(1)(A) of the DMCA, Shirt Bazaar implements a strict repeat infringer termination policy.
                Accounts that are the subject of repeated, substantiated copyright infringement notices will have their access terminated,
                their public storefronts removed, and their ability to generate or claim designs permanently revoked.
              </p>
            </>
          ),
        },
        {
          id: "designated-agent",
          number: "08",
          heading: "Designated DMCA Copyright Agent Contact",
          plainEnglishSummary: [
            "All DMCA notices and IP inquiries must be submitted to our Designated Copyright Agent.",
            "Email: legal@shirtbazaar.com (fastest response).",
          ],
          searchKeywords: ["dmca agent", "copyright agent", "contact", "address", "legal email"],
          content: (
            <>
              <p>
                Formal DMCA notices and intellectual property inquiries should be directed to our registered agent:
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs sm:text-sm text-foreground">
                <p><strong>Shirt Bazaar, Inc. — DMCA Copyright Department</strong></p>
                <p>Attention: Designated Copyright Agent</p>
                <p>1209 Orange Street, Wilmington, DE 19801, United States</p>
                <p className="mt-2">
                  Email for DMCA Notices: <a href="mailto:legal@shirtbazaar.com" className="font-semibold underline">legal@shirtbazaar.com</a>
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Subject Line Format: <code>DMCA Takedown Notice - [Design ID / URL]</code>
                </p>
              </div>
            </>
          ),
        },
      ]}
    />
  )
}
