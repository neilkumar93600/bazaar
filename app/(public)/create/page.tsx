import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { stylesForVibeSlug } from "@/lib/generation/styles";
import { DAILY_IMAGE_CAP, IMAGES_PER_JOB } from "@/lib/generation/quota";
import { getGarmentOptions } from "@/app/dashboard/designs/garment-options";
import { CreateForm } from "@/components/create/CreateForm";

export const metadata: Metadata = { title: "Create" };

/** In the `(public)` route group for its chrome — navbar and footer — not
 *  because it is public. `lib/supabase/middleware.ts` lists `/create` among the
 *  protected routes, so a signed-out visitor is bounced to `/login` and their
 *  draft is restored from sessionStorage afterwards.
 *
 *  `?prompt=` / `?vibe=` carry a draft handed off from the home hero. They are
 *  a convenience only — the form re-validates and `/api/generate` resolves
 *  everything itself rather than trusting either.
 *
 *  `?vibe=` is a vibe id, because the hero's chips are vibes. The form no longer
 *  takes a vibe (a style carries its own), so it is translated here into the
 *  first style filed under that vibe. That keeps the hero's existing chips
 *  meaningful without asking it to know about styles. */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string; vibe?: string }>;
}) {
  const [supabase, { prompt, vibe }, garmentOptions] = await Promise.all([
    createClient(),
    searchParams,
    getGarmentOptions(),
  ]);

  const { data: vibes } = await supabase.from("vibes").select("id, slug");
  const vibeSlug = vibe ? (vibes?.find((v) => v.id === vibe)?.slug ?? null) : null;
  const initialStyleSlug = vibeSlug
    ? (stylesForVibeSlug(vibeSlug)[0]?.slug ?? null)
    : null;

  return (
    <div className="mx-auto flex max-w-page flex-col gap-8 px-6 py-16 md:px-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <h1 className="text-heading-lg text-foreground">Create a design</h1>
        <p className="text-body max-w-xl text-muted-foreground">
          Describe an idea, pick how it should look. You get four to choose
          from — they stay private until you list one.
        </p>
      </div>

      {/* The caps are read here, not imported by the form: `quota.ts` reads a
          server-only env var, so a client bundle would silently see the code
          default instead of the configured number. */}
      <CreateForm
        initialPrompt={prompt ?? null}
        initialStyleSlug={initialStyleSlug}
        imagesPerJob={IMAGES_PER_JOB}
        dailyImageCap={DAILY_IMAGE_CAP}
        garmentOptions={garmentOptions}
      />
    </div>
  );
}
