import type { Metadata } from "next";
import { VerifyOtpForm } from "@/components/auth";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyOtpPage(props: PageProps<"/verify-otp">) {
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
          Check <span className="font-black text-foreground">Your Email</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Enter the verification code sent to your email address to confirm your account.
        </p>
      </div>
      <VerifyOtpForm email={email} />
    </div>
  );
}
