import type { Metadata } from "next";
import { SignupForm } from "@/components/auth";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
          Create <span className="font-black text-foreground">Your Account!</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Claim designs, build your storefront, and earn royalties.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
