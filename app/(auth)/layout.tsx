import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { AuthHeroPanel, AuthTransition } from "@/components/auth";
import { FadeIn } from "@/components/ui/motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2 bg-background text-foreground">
      {/* Left Column — Auth Form Area */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-svh w-full">
        {/* Top Brand Bar */}
        <FadeIn y={-8}>
          <Logo textClassName="text-foreground font-extrabold" />
        </FadeIn>

        {/* Form Container */}
        <div className="relative my-auto py-8 w-full max-w-md mx-auto">
          <AuthTransition>{children}</AuthTransition>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Shirt Bazaar Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column — Hero Visual Panel */}
      <AuthHeroPanel />
    </div>
  );
}
