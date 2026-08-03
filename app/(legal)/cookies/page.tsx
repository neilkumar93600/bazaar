import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="What cookies we use and why we keep it minimal"
      lastUpdated="[Date]"
      sections={[
        {
          heading: "Overview",
          body: (
            <p>
              This policy explains the cookies Shirt Bazaar uses and why. We
              keep cookie use minimal — we don&apos;t run third-party
              advertising trackers.
            </p>
          ),
        },
        {
          heading: "Essential cookies",
          body: (
            <p>
              These are required for the site to work and can&apos;t be
              turned off. They include the session cookies that keep you
              signed in — set as httpOnly and secure so they can&apos;t be
              read by page scripts — and cookies that protect against
              cross-site request forgery.
            </p>
          ),
        },
        {
          heading: "Functional cookies",
          body: (
            <p>
              We may use a small number of cookies to remember preferences,
              like which vibes/columns you follow or your last-viewed feed
              state, so the site feels consistent between visits.
            </p>
          ),
        },
        {
          heading: "Analytics",
          body: (
            <p>
              [If/when analytics tooling is added, name the provider here and
              what it measures — page views, conversion events, etc. None is
              in use as of this policy&apos;s last update.]
            </p>
          ),
        },
        {
          heading: "Managing cookies",
          body: (
            <p>
              Most browsers let you block or delete cookies in their
              settings. Blocking essential cookies will prevent you from
              staying signed in and may break parts of the site that depend
              on your session.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              We may update this policy as the cookies we use change.
              Material changes will be posted here with an updated date
              above.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about this policy:{" "}
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
