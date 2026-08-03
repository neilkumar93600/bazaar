import type { ReactNode } from "react";

import { LegalNav } from "./LegalNav";

export type LegalSection = {
  heading: string;
  body: ReactNode;
};

export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  sections,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <LegalNav />

      <div className="flex flex-col gap-3">
        <h1 className="text-display text-foreground uppercase tracking-tight">
          {title}
        </h1>
        <p className="text-body-sm text-muted-foreground uppercase tracking-wide">
          {subtitle}
        </p>
      </div>

      <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-caption text-primary">
        Draft — pending legal review. Bracketed placeholders (company legal
        name, jurisdiction, address) need real values before this ships.
      </div>

      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <div
            key={section.heading}
            className="grid grid-cols-1 gap-3 border-t border-hairline pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[220px_1fr] lg:gap-8"
          >
            <h2 className="text-subheading text-foreground">{section.heading}</h2>
            <div className="flex flex-col gap-4 text-body text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:list-disc [&_ul]:gap-1.5 [&_ul]:pl-6">
              {section.body}
            </div>
          </div>
        ))}
      </div>

      <p className="text-body-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>
    </div>
  );
}
