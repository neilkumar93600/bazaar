import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <ComingSoon
      title="Cookie Policy"
      description="Our cookie policy is being finalized. Check back soon."
    />
  );
}
