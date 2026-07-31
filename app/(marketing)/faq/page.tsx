import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <ComingSoon
      title="Frequently asked questions"
      description="Answers are coming soon."
    />
  );
}
