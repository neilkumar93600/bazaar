import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
          Reset <span className="font-black text-foreground">Your Password</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Enter your email address and we&apos;ll send you a password reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
