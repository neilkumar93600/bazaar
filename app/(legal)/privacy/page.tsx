import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageLayout } from "@/components/legal/LegalPageLayout"

export const metadata: Metadata = {
  title: "Privacy Policy | Shirt Bazaar",
  description:
    "Comprehensive GDPR & CCPA privacy policy explaining data collection, sub-processors, AI prompt processing, retention periods, and your rights on Shirt Bazaar.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How Shirt Bazaar collects, protects, processes, and respects your personal data across our global marketplace."
      metadata={{
        version: "2.3",
        lastUpdated: "January 15, 2026",
        effectiveDate: "January 15, 2026",
        jurisdiction: "Delaware, United States & GDPR/CCPA Compliant",
        readingTime: "8 min read",
        contactEmail: "privacy@shirtbazaar.com",
      }}
      sections={[
        {
          id: "overview",
          number: "01",
          heading: "Overview & Data Controller",
          plainEnglishSummary: [
            "This policy details what personal data we collect, why we need it, and how we protect it under global privacy standards (including GDPR and CCPA/CPRA).",
            "Shirt Bazaar, Inc. acts as the primary Data Controller for your information.",
            "We never sell your personal data or uploaded art to third-party data brokers.",
          ],
          searchKeywords: ["privacy", "gdpr", "ccpa", "data controller", "scope", "overview"],
          content: (
            <>
              <p>
                <strong>Shirt Bazaar, Inc.</strong> (<strong>&quot;Shirt Bazaar&quot;</strong>, <strong>&quot;we&quot;</strong>, <strong>&quot;us&quot;</strong>)
                is committed to safeguarding your fundamental right to privacy. This Privacy Policy details our practices concerning the collection, storage, processing,
                transfer, and disclosure of personal data when you interact with our platform, website, APIs, generation studio, and physical commerce services.
              </p>
              <p>
                For individuals residing within the European Economic Area (EEA), United Kingdom, or Switzerland, Shirt Bazaar, Inc. serves as the designated{" "}
                <strong>Data Controller</strong> responsible for your personal information.
              </p>
            </>
          ),
        },
        {
          id: "information-collected",
          number: "02",
          heading: "Categories of Information We Collect",
          plainEnglishSummary: [
            "Account data: email, display name, handle, and avatar.",
            "Art & Prompts: prompts, reference images, and generated/claimed designs.",
            "Commerce data: shipping destination, garment sizing, and order fulfillment history. (Payment cards are tokenized directly via Bolt).",
            "Technical telemetry: IP address, device fingerprints, and security event logs.",
          ],
          searchKeywords: ["data collection", "account info", "prompts", "images", "shipping address", "telemetry", "ip address"],
          content: (
            <>
              <p>We collect personal information across the following categories:</p>
              <ul>
                <li>
                  <strong>Account & Identity Data:</strong> Email address, hashed authentication credentials, chosen public handle (<code>/creator/yourhandle</code>),
                  display name, profile avatar, and communication preferences.
                </li>
                <li>
                  <strong>Generative Prompts & Reference Media:</strong> Text prompt strings, style parameters, and reference images you upload to the studio to guide AI generation.
                </li>
                <li>
                  <strong>Order & Shipping Data:</strong> Recipient name, physical delivery address, phone number (for carrier dispatch), garment size, and color selections.
                  <em>Note: Full payment card details are collected directly by our PCI-DSS Level 1 payment gateway (Bolt) and are never stored on Shirt Bazaar servers.</em>
                </li>
                <li>
                  <strong>Platform Messages:</strong> In-app messages exchanged between creators and buyers via the messaging system.
                </li>
                <li>
                  <strong>Technical & Telemetry Data:</strong> IP address, device type, operating system, browser configuration, request timestamps, and security anomaly logs.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "processing-purposes",
          number: "03",
          heading: "Purposes & Legal Bases for Processing",
          plainEnglishSummary: [
            "We only process data when we have a valid lawful basis under GDPR Article 6.",
            "Primary legal bases include: Performing our contract with you (fulfilling shirts & claims), Legitimate Interests (fraud prevention & platform security), and Legal Compliance.",
          ],
          searchKeywords: ["legal basis", "gdpr article 6", "contract performance", "legitimate interest", "purpose"],
          content: (
            <>
              <p>Under GDPR and international privacy frameworks, we process your information under the following lawful bases:</p>
              <div className="overflow-x-auto my-4">
                <table>
                  <thead>
                    <tr>
                      <th>Processing Purpose</th>
                      <th>Data Category</th>
                      <th>Lawful Basis (GDPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Generating designs from your prompts and reference media</td>
                      <td>Prompts, Uploads</td>
                      <td>Performance of Contract</td>
                    </tr>
                    <tr>
                      <td>Operating 1-of-1 claims, storefront provisioning, and physical apparel fulfillment</td>
                      <td>Account, Shipping, Order Details</td>
                      <td>Performance of Contract</td>
                    </tr>
                    <tr>
                      <td>Accounting, tracking, and distributing creator resale royalties</td>
                      <td>Claim Records, Ledger Data</td>
                      <td>Performance of Contract & Legal Obligation</td>
                    </tr>
                    <tr>
                      <td>Fraud detection, bot prevention, and content moderation</td>
                      <td>IP, Telemetry, Prompts</td>
                      <td>Legitimate Interest & Public Safety</td>
                    </tr>
                    <tr>
                      <td>Tax calculation, financial auditing, and regulatory reporting</td>
                      <td>Transaction Logs, Invoices</td>
                      <td>Legal Obligation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "sub-processors",
          number: "04",
          heading: "Third-Party Sub-Processors & Data Sharing",
          plainEnglishSummary: [
            "We share data only with verified sub-processors necessary to run the service.",
            "Sub-processors include Bolt (payments), Print-on-Demand facilities (garment manufacturing), Supabase/AWS (cloud database & auth), and Cloudflare (security).",
            "We do NOT sell, rent, or monetize your personal data to ad networks.",
          ],
          searchKeywords: ["sub-processors", "third parties", "bolt", "supabase", "cloudflare", "fulfillment partner", "sharing"],
          content: (
            <>
              <p>
                We do not sell personal data. To execute the Services, we share limited data with the following vetted third-party sub-processors:
              </p>
              <ul>
                <li>
                  <strong>Payment Processing:</strong> <strong>Bolt Financial, Inc.</strong> processes card payments, fraud mitigation, and buyer checkout flows under strict PCI-DSS compliance.
                </li>
                <li>
                  <strong>Print & Fulfillment Facilities:</strong> Certified print-on-demand manufacturing networks receive shipping names, delivery addresses, and high-resolution print files to manufacture and deliver your garment.
                </li>
                <li>
                  <strong>Cloud Infrastructure & Database:</strong> <strong>Supabase, Inc.</strong> and <strong>Amazon Web Services (AWS)</strong> provide encrypted database storage, authentication, and secure backups.
                </li>
                <li>
                  <strong>Edge Network & DDoS Mitigation:</strong> <strong>Cloudflare, Inc.</strong> provides web application firewall (WAF), caching, and edge routing.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "data-retention",
          number: "05",
          heading: "Data Retention & Ledger Permanence",
          plainEnglishSummary: [
            "Active account data is kept while your account remains in good standing.",
            "Financial, order, and tax records are retained for 7 years as required by statutory law.",
            "1-of-1 Genesis Claim records and royalty provenance are retained permanently on our platform ledger to safeguard creator royalty rights.",
          ],
          searchKeywords: ["retention", "ledger", "permanence", "deletion timeline", "tax records"],
          content: (
            <>
              <p>
                <strong>5.1 Retention Standard:</strong> We retain personal data only for as long as necessary to fulfill the purposes for which it was collected,
                including servicing your account, fulfilling warranty guarantees, resolving disputes, and adhering to statutory tax and financial reporting mandates (typically 7 years).
              </p>
              <p>
                <strong>5.2 1-of-1 Claim & Provenance Permanence:</strong> Because a 1-of-1 Genesis Claim conveys permanent commercial IP assignment and perpetual royalty rights,
                immutable records of the claim timestamp, creator handle, and design hash are maintained permanently in our platform ledger to protect future royalty distribution.
              </p>
            </>
          ),
        },
        {
          id: "international-transfers",
          number: "06",
          heading: "International Data Transfers",
          plainEnglishSummary: [
            "Your data may be processed in the United States and other global cloud regions.",
            "All cross-border data transfers are protected under Standard Contractual Clauses (SCCs) approved by the European Commission.",
          ],
          searchKeywords: ["international transfer", "cross border", "scc", "standard contractual clauses", "eea"],
          content: (
            <>
              <p>
                Shirt Bazaar operates globally with primary cloud infrastructure hosted in the United States. If you access our platform from the European Economic Area (EEA),
                United Kingdom, or other regions with data transfer laws, your personal data will be transferred to and processed in the United States.
              </p>
              <p>
                We ensure adequate data protection safeguards through <strong>Standard Contractual Clauses (SCCs)</strong> adopted by the European Commission and relevant International Data Transfer Addenda.
              </p>
            </>
          ),
        },
        {
          id: "user-rights",
          number: "07",
          heading: "Your Rights (GDPR, CCPA/CPRA & Global)",
          plainEnglishSummary: [
            "You have the right to access, download (data portability), correct, or delete your personal data.",
            "California residents may submit CCPA requests; we do not sell or share personal information.",
            "To submit a Data Subject Request (DSR), email privacy@shirtbazaar.com with your verified account handle.",
          ],
          searchKeywords: ["rights", "gdpr rights", "ccpa", "cpra", "dsr", "erasure", "portability", "opt out"],
          content: (
            <>
              <p>Depending on your geographic jurisdiction, you possess the following statutory privacy rights:</p>
              <ul>
                <li><strong>Right of Access & Portability:</strong> Obtain confirmation of processing and receive a machine-readable copy of your personal data.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete information.</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your account and personal data, subject to legal and tax retention exemptions.</li>
                <li><strong>Right to Restrict or Object to Processing:</strong> Object to processing based on legitimate interests or direct communications.</li>
                <li><strong>CCPA Non-Discrimination:</strong> California residents have the right not to receive discriminatory treatment for exercising privacy rights.</li>
              </ul>
              <p>
                To submit a verified Data Subject Request, email our privacy desk at{" "}
                <a href="mailto:privacy@shirtbazaar.com">privacy@shirtbazaar.com</a>. We respond to all verified requests within thirty (30) calendar days.
              </p>
            </>
          ),
        },
        {
          id: "security-measures",
          number: "08",
          heading: "Security Architecture & Encryption",
          plainEnglishSummary: [
            "All data in transit is encrypted using modern TLS 1.3.",
            "Data at rest is secured using AES-256 encryption.",
            "We employ strict role-based access control (RBAC), multi-factor authentication, and continuous automated vulnerability monitoring.",
          ],
          searchKeywords: ["security", "encryption", "tls", "aes-256", "protection", "vulnerabilities"],
          content: (
            <>
              <p>
                We implement industry-leading technical and organizational security controls designed to protect personal data against accidental loss, unauthorized access,
                destruction, or disclosure. These controls include:
              </p>
              <ul>
                <li>Full encryption in transit via <strong>TLS 1.3</strong> and strong cryptographic cipher suites.</li>
                <li>Full database encryption at rest using <strong>AES-256</strong>.</li>
                <li>Least-privilege role-based access controls (RBAC) and hardware-backed multi-factor administrative authentication.</li>
                <li>Automated security log auditing, anomaly detection, and regular vulnerability assessments.</li>
              </ul>
            </>
          ),
        },
        {
          id: "children-privacy",
          number: "09",
          heading: "Children's Privacy Protection",
          plainEnglishSummary: [
            "Shirt Bazaar is strictly intended for individuals aged 18 and older.",
            "We do not knowingly collect personal data from children under 13 (or under 16 in certain EU jurisdictions).",
          ],
          searchKeywords: ["children", "coppa", "age limit", "minor"],
          content: (
            <>
              <p>
                Shirt Bazaar is not directed to children under the age of 13 (or under 16 within applicable European jurisdictions). We do not knowingly solicit or collect
                personal data from minors. If you believe a child has provided us with personal information without parental consent, please contact{" "}
                <a href="mailto:privacy@shirtbazaar.com">privacy@shirtbazaar.com</a> so we can promptly delete the account and associated records.
              </p>
            </>
          ),
        },
        {
          id: "contact-dpo",
          number: "10",
          heading: "Privacy Inquiries & Data Protection Contact",
          plainEnglishSummary: [
            "Direct all privacy questions, data export requests, and compliance notices to privacy@shirtbazaar.com.",
            "EU/UK residents have the right to lodge a complaint with their local supervisory data authority.",
          ],
          searchKeywords: ["contact", "dpo", "data protection officer", "inquiries", "supervisory authority"],
          content: (
            <>
              <p>
                For questions regarding this Privacy Policy or to exercise your statutory rights, please contact our Data Protection Team:
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs sm:text-sm text-foreground">
                <p><strong>Shirt Bazaar, Inc. — Privacy & Compliance Office</strong></p>
                <p>Attention: Data Protection Officer</p>
                <p>1209 Orange Street, Wilmington, DE 19801, United States</p>
                <p className="mt-2">
                  Direct Inquiries: <a href="mailto:privacy@shirtbazaar.com" className="font-semibold underline">privacy@shirtbazaar.com</a>
                </p>
              </div>
            </>
          ),
        },
      ]}
    />
  )
}
