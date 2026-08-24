import type { Metadata } from "next";

import { confirmRecovery } from "./actions";
import { ConfirmRecoveryButton } from "@/components/auth/ConfirmRecoveryButton";

export const metadata: Metadata = { title: "Confirm password reset" };

export default async function ConfirmResetPasswordPage(
  props: PageProps<"/reset-password/confirm">,
) {
  const searchParams = await props.searchParams;
  const tokenHash = typeof searchParams.token_hash === "string" ? searchParams.token_hash : "";
  const type = typeof searchParams.type === "string" ? searchParams.type : "";
  const next = typeof searchParams.next === "string" ? searchParams.next : "/reset-password";

  if (!tokenHash || !type) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
            That link&apos;s not <span className="font-serif font-medium italic">right</span>
          </h1>
          <p className="text-body-sm text-muted-ink font-medium">
            This page needs a password reset link to work from. Request a new one and open it
            straight from the email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Confirm your <span className="font-serif font-medium italic">password reset</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium">
          One more click, on purpose — some mail apps open links automatically to scan them,
          which would otherwise use this link up before you did.
        </p>
      </div>
      <form action={confirmRecovery} className="flex flex-col gap-4">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next} />
        <ConfirmRecoveryButton />
      </form>
    </div>
  );
}
