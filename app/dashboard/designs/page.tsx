import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "My Designs" };

export default function DesignsPage() {
  return (
    <ComingSoon
      title="My designs"
      description="Owned designs, storefront management, and royalty tracking are coming soon."
    />
  );
}
