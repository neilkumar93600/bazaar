import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Bid" };

export default function AuctionsPage() {
  return (
    <ComingSoon
      title="Bid"
      description="Live auctions on limited designs. Coming soon."
    />
  );
}
