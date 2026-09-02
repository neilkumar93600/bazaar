import type { Metadata } from "next";
import { VerifyOtpForm } from "@/components/auth";
import { safeNext } from "@/lib/auth/next-url";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyOtpPage(props: PageProps<"/verify-otp">) {
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";
  const next = safeNext(
    typeof searchParams.next === "string" ? searchParams.next : null,
    "/",
  );

  return (
    <div className="flex flex-col items-center text-center gap-6 w-full max-w-sm mx-auto">

      {/* Header & Subtitle */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Please check <span className="font-serif font-medium italic">your email</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium leading-relaxed">
          We&apos;ve sent a code to{" "}
          {email ? (
            <span className="font-semibold text-ink break-all">{email}</span>
          ) : (
            <span className="font-semibold text-ink">your inbox</span>
          )}
        </p>
      </div>

      {/* 6-box Form */}
      <VerifyOtpForm email={email} next={next} />
    </div>
  );
}

