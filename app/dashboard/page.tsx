import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardOverviewPage() {
  return (
    <ComingSoon
      title="Overview"
      description="Your claims, royalties, and activity summary are coming soon."
    />
  );
}
