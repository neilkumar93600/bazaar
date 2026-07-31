import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <ComingSoon
      title="Careers"
      description="Open roles are coming soon."
    />
  );
}
