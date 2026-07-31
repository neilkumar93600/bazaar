import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <ComingSoon title="Messages" description="Your inbox is coming soon." />
  );
}
