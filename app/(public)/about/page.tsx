import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoon
      title="About Shirt Bazaar"
      description="Our story is coming soon."
    />
  );
}
