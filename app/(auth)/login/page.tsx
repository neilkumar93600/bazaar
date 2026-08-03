import type { Metadata } from "next";
import { LoginForm } from "@/components/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
          Hello, <span className="font-black text-foreground">Welcome Back!</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          We&apos;re happy to see you again. Let&apos;s stay ahead of the game.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
