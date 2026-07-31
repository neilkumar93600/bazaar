"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resendOtp, verifyOtp, type VerifyOtpState } from "../actions";

const initialState: VerifyOtpState = {};

export function VerifyOtpForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(verifyOtp, initialState);
  const [isResending, startResend] = useTransition();
  const [resent, setResent] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" defaultValue={email} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="token">Verification code</FieldLabel>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            required
          />
        </Field>
        {state.error && <FieldError>{state.error}</FieldError>}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Verifying…" : "Verify"}
        </Button>
      </FieldGroup>
      <button
        type="button"
        disabled={isResending}
        onClick={() => {
          const emailInput = document.getElementById("email") as HTMLInputElement | null;
          startResend(async () => {
            await resendOtp(emailInput?.value ?? email);
            setResent(true);
          });
        }}
        className="text-body-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isResending ? "Sending…" : resent ? "Code resent" : "Resend code"}
      </button>
    </form>
  );
}
