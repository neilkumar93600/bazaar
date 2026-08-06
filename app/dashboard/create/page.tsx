import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { CreateForm } from "@/components/create/CreateForm";

export const metadata: Metadata = { title: "Create" };

/** `?prompt=` / `?vibe=` carry a draft handed off from the home hero. They are
 *  a convenience only — the form re-validates, and `/api/generate` resolves the
 *  vibe id itself rather than trusting it. */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string; vibe?: string }>;
}) {
  const [supabase, { prompt, vibe }] = await Promise.all([
    createClient(),
    searchParams,
  ]);
  const { data: vibes } = await supabase
    .from("vibes")
    .select("id, name")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex max-w-page flex-col gap-8 px-6 py-16 md:px-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <h1 className="text-heading-lg text-foreground">Create a design</h1>
        <p className="text-body max-w-xl text-muted-foreground">
          Describe an idea. We turn it into a one-of-one design in the Shirt
          Bazaar house style.
        </p>
      </div>

      <CreateForm
        vibes={vibes ?? []}
        initialPrompt={prompt ?? null}
        initialVibeId={vibe ?? null}
      />
    </div>
  );
}
