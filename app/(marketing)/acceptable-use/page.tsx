import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Acceptable Use" };

export default function AcceptableUsePage() {
  return (
    <ComingSoon
      title="Acceptable Use"
      description="What you can and can't generate or upload is being finalized. Check back soon."
    />
  );
}
