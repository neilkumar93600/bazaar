import type { Metadata } from "next";
import { SignupForm } from "./components/SignupForm";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-heading-sm text-white">
          Create your account
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Claim designs, build your storefront, earn on resales.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
