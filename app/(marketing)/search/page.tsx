import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <ComingSoon
      title="Search"
      description="Cross-vibe, cross-creator search is coming soon."
    />
  );
}
