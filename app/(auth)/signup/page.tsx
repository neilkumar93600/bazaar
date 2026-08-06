import type { Metadata } from "next";
import { SignupForm } from "@/components/auth";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Claim your <span className="font-serif font-medium italic">vibe</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium">
          Create an account to claim 1-of-1 AI shirt designs and earn 10% resale royalties.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}

