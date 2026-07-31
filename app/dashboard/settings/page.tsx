import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Account, Notifications, Twin, AI, and Payouts tabs are coming soon."
    />
  );
}
