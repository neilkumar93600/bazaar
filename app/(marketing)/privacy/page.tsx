import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="Our full privacy policy is being finalized. Check back soon."
    />
  );
}
