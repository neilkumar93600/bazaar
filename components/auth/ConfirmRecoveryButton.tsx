"use client";

import { useFormStatus } from "react-dom";

/** Split into its own client component for exactly one reason: `useFormStatus`
 *  needs to sit inside the `<form>` it reports on, and the form itself lives
 *  in a server component (app/(auth)/reset-password/confirm/page.tsx) so that
 *  page can read `searchParams` server-side without a round trip. */
export function ConfirmRecoveryButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-2 btn-ember font-medium py-3 px-6 disabled:opacity-50 text-body-sm cursor-pointer"
    >
      {pending ? "CONFIRMING…" : "CONFIRM PASSWORD RESET"}
    </button>
  );
}
