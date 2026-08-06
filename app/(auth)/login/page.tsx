import type { Metadata } from "next";
import { LoginForm } from "@/components/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Welcome <span className="font-serif font-medium italic">back</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium">
          Enter your credentials to access your 1-of-1 design collection.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

