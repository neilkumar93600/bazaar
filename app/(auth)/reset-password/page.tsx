import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Set a new <span className="font-serif font-medium italic">password</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium">
          Choose a strong password for your Shirt Bazaar account.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

