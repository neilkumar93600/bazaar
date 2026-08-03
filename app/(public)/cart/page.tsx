import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <ComingSoon
      title="Cart"
      description="Checkout is coming soon."
    />
  );
}
