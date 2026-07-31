import type { Metadata } from "next";
import { LoginForm } from "./components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to your account.</p>
      </div>
      <LoginForm />
    </div>
  );
}
