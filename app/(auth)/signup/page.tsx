import type { Metadata } from "next";
import { CarriedPromptNote, SignupForm } from "@/components/auth";
import { promptFromNext, safeNext } from "@/lib/auth/next-url";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage(props: PageProps<"/signup">) {
  const searchParams = await props.searchParams;
  // Defaults to /create rather than the dashboard: someone finishing signup
  // came here to make something, not to read a page of zeros.
  const next = safeNext(
    typeof searchParams.next === "string" ? searchParams.next : null,
    "/create",
  );
  const carriedPrompt = promptFromNext(next);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-sans">
          Claim your <span className="font-serif font-medium italic">vibe</span>
        </h1>
        <p className="text-body-sm text-muted-ink font-medium">
          Create an account to claim 1-of-1 AI shirt designs and earn 10% resale royalties.
        </p>
      </div>
      {carriedPrompt && <CarriedPromptNote prompt={carriedPrompt} />}
      <SignupForm next={next} />
    </div>
  );
}

