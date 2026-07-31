import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <ComingSoon
      title="Refund Policy"
      description="Our refund policy is being finalized. Check back soon."
    />
  );
}
