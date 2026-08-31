import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageLayout } from "@/components/legal/LegalPageLayout"

export const metadata: Metadata = {
  title: "Cookie Policy | Shirt Bazaar",
  description:
    "Transparent Cookie Policy detailing essential authentication cookies, user preferences, zero third-party advertising trackers, and browser controls on Shirt Bazaar.",
  alternates: { canonical: "/cookies" },
}

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="How Shirt Bazaar utilizes essential session cookies and preferences with a strict commitment to zero third-party advertising tracking."
      metadata={{
        version: "2.1",
        lastUpdated: "January 15, 2026",
        effectiveDate: "January 15, 2026",
        jurisdiction: "Delaware, United States & EU ePrivacy Directive",
        readingTime: "4 min read",
        contactEmail: "privacy@shirtbazaar.com",
      }}
      sections={[
        {
          id: "overview",
          number: "01",
          heading: "Overview & Zero-Ad Tracking Policy",
          plainEnglishSummary: [
            "We only use cookies that are necessary to run the site and preserve your login and preferences.",
            "We DO NOT use invasive third-party ad retargeting cookies or sell your browsing activity.",
            "Cookies are small text files stored locally on your device by your browser.",
          ],
          searchKeywords: ["cookie policy", "ad tracking", "privacy first", "zero ad", "overview", "what are cookies"],
          content: (
            <>
              <p>
                This Cookie Policy explains how <strong>Shirt Bazaar, Inc.</strong> (<strong>&quot;Shirt Bazaar&quot;</strong>, <strong>&quot;we&quot;</strong>, <strong>&quot;us&quot;</strong>)
                uses cookies, local storage tokens, and similar web technologies when you access our marketplace.
              </p>
              <p>
                <strong>Our Philosophy:</strong> We believe in privacy by default. We do not participate in cross-site behavioral advertising networks,
                do not embed third-party surveillance pixels, and do not monetize your browsing telemetry.
              </p>
            </>
          ),
        },
        {
          id: "essential-cookies",
          number: "02",
          heading: "Strictly Necessary Authentication & Security Cookies",
          plainEnglishSummary: [
            "Essential cookies are required for you to log in, navigate between pages, and securely process transactions.",
            "These cookies use Secure and HttpOnly flags to protect against cross-site scripting (XSS) and cross-site request forgery (CSRF).",
            "You cannot disable essential cookies without breaking core site functionality.",
          ],
          searchKeywords: ["essential cookies", "authentication", "session", "supabase auth", "csrf", "security"],
          content: (
            <>
              <p>
                Strictly Necessary Cookies are essential for the operation of the Platform. Without these technologies, fundamental services—such as maintaining an authenticated session,
                accessing your private studio, and executing secure checkouts—cannot be provided.
              </p>
              <p>
                Under EU ePrivacy Directive Article 5(3) and GDPR Recital 30, strictly necessary cookies do not require prior consent because they are required to deliver the service explicitly requested by the user.
              </p>
            </>
          ),
        },
        {
          id: "functional-preferences",
          number: "03",
          heading: "Functional & Preference Storage",
          plainEnglishSummary: [
            "Functional cookies remember choices you make, such as your selected vibe filters, cart state, or dismissed banners.",
            "These ensure you don't have to reconfigure your viewing preferences every time you open a new tab.",
          ],
          searchKeywords: ["functional cookies", "preferences", "cart state", "vibe filters", "ui state"],
          content: (
            <>
              <p>
                Functional cookies allow the Platform to remember your choices and provide enhanced, personalized functionality. Examples include remembering your recent feed filters,
                preserving items in your active shopping bag, and remembering whether you have dismissed informational banners.
              </p>
            </>
          ),
        },
        {
          id: "cookie-manifest",
          number: "04",
          heading: "Complete Cookie & Storage Manifest",
          plainEnglishSummary: [
            "Review our detailed table of all cookies, their origin, lifespan, and purpose.",
            "We maintain strict data minimization across all storage keys.",
          ],
          searchKeywords: ["cookie table", "manifest", "supabase-auth", "lifespan", "purpose", "expiration"],
          content: (
            <>
              <p>The table below provides a complete description of the cookies and local storage tokens utilized across our domains:</p>
              <div className="overflow-x-auto my-4">
                <table>
                  <thead>
                    <tr>
                      <th>Cookie / Key Name</th>
                      <th>Provider / Source</th>
                      <th>Category</th>
                      <th>Expiration</th>
                      <th>Description & Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>sb-*-auth-token</code></td>
                      <td>Shirt Bazaar (Supabase)</td>
                      <td>Strictly Necessary</td>
                      <td>Session / 30 Days</td>
                      <td>Maintains encrypted cryptographic JWT tokens for user authentication and session security.</td>
                    </tr>
                    <tr>
                      <td><code>sb_csrf_token</code></td>
                      <td>Shirt Bazaar</td>
                      <td>Strictly Necessary</td>
                      <td>Session</td>
                      <td>Protects API endpoints against Cross-Site Request Forgery attacks.</td>
                    </tr>
                    <tr>
                      <td><code>bazaar_cart_session</code></td>
                      <td>Shirt Bazaar</td>
                      <td>Functional</td>
                      <td>7 Days</td>
                      <td>Preserves selected garment sizes, placement options, and designs in your shopping bag.</td>
                    </tr>
                    <tr>
                      <td><code>bazaar_feed_prefs</code></td>
                      <td>Shirt Bazaar</td>
                      <td>Functional</td>
                      <td>30 Days</td>
                      <td>Stores your preferred bazaar grid view mode and sort filters.</td>
                    </tr>
                    <tr>
                      <td><code>__cf_bm</code></td>
                      <td>Cloudflare</td>
                      <td>Security / Telemetry</td>
                      <td>30 Minutes</td>
                      <td>Cloudflare bot management cookie used to distinguish between humans and automated DDoS attacks.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "manage-cookies",
          number: "05",
          heading: "How to Manage and Disable Cookies in Your Browser",
          plainEnglishSummary: [
            "You can control or clear cookies directly in your web browser settings at any time.",
            "Blocking essential cookies may prevent you from logging in or placing orders.",
          ],
          searchKeywords: ["browser settings", "disable cookies", "chrome", "safari", "firefox", "edge", "opt out"],
          content: (
            <>
              <p>
                You can manage, restrict, or delete cookies at any time through your browser settings. Below are direct links to cookie management instructions for popular browsers:
              </p>
              <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome Cookie Management</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari Cookie Preferences</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Mozilla Firefox Privacy Settings</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge Cookie Controls</a></li>
              </ul>
              <p>
                <em>Note: If you configure your browser to block all cookies (including strictly necessary cookies), you will be unable to log in, access your private studio, or complete purchases.</em>
              </p>
            </>
          ),
        },
        {
          id: "contact-inquiries",
          number: "06",
          heading: "Questions & Inquiries",
          plainEnglishSummary: [
            "If you have questions regarding our cookie practices, reach out to privacy@shirtbazaar.com.",
            "Also consult our full Privacy Policy for details on your data subject rights.",
          ],
          searchKeywords: ["contact", "inquiries", "privacy email", "help"],
          content: (
            <>
              <p>
                If you have any questions or feedback regarding our use of cookies, please contact our Privacy Team:
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs sm:text-sm text-foreground">
                <p><strong>Shirt Bazaar, Inc. — Privacy Team</strong></p>
                <p>Email: <a href="mailto:privacy@shirtbazaar.com" className="font-semibold underline">privacy@shirtbazaar.com</a></p>
                <p className="mt-1">
                  See also our complete <Link href="/privacy" className="underline font-semibold">Privacy Policy</Link> and <Link href="/terms" className="underline font-semibold">Terms of Service</Link>.
                </p>
              </div>
            </>
          ),
        },
      ]}
    />
  )
}
