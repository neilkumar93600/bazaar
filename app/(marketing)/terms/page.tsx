import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms of Service"
      description="Our full terms are being finalized. Check back soon."
    />
  );
}
