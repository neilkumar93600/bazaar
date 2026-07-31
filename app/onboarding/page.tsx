import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <ComingSoon
        title="Welcome to Shirt Bazaar"
        description="Your first-session setup is coming soon."
      />
    </div>
  );
}
