import type { Metadata } from "next";
import { VerifyOtpForm } from "./components/VerifyOtpForm";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyOtpPage(props: PageProps<"/verify-otp">) {
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-heading-sm text-white">
          Check your email
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Enter the code we sent to confirm your account.
        </p>
      </div>
      <VerifyOtpForm email={email} />
    </div>
  );
}
