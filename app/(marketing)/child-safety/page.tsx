import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Child Safety" };

export default function ChildSafetyPage() {
  return (
    <ComingSoon
      title="Child Safety"
      description="Our child safety standards and reporting process are being finalized. Check back soon."
    />
  );
}
