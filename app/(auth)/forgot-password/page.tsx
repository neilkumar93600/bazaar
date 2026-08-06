import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Reset your <span className="font-serif font-medium italic">password</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium">
          Enter your email address and we&apos;ll send you a password reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

