import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
          Set a <span className="font-black text-foreground">New Password</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Choose a strong password for your Shirt Bazaar account.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
