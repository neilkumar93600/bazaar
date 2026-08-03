import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Blog" };

export default function BlogIndexPage() {
  return (
    <ComingSoon
      title="Blog"
      description="Posts are coming soon."
    />
  );
}
