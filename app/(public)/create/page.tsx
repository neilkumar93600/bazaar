import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { stylesForVibeSlug } from "@/lib/generation/styles";
import { DAILY_IMAGE_CAP, IMAGES_PER_JOB } from "@/lib/generation/quota";
import { getGarmentOptions } from "@/app/dashboard/designs/garment-options";
import { getUserPersonas } from "@/lib/data/personas";
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

  const [{ data: vibes }, userPersonas] = await Promise.all([
    supabase.from("vibes").select("id, slug"),
    getUserPersonas(supabase),
  ]);
  const vibeSlug = vibe ? (vibes?.find((v) => v.id === vibe)?.slug ?? null) : null;
  const initialStyleSlug = vibeSlug
    ? (stylesForVibeSlug(vibeSlug)[0]?.slug ?? null)
    : null;

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-6 py-12 md:px-16 sm:py-16">
      {/* Studio Hero Header */}
      <div className="flex flex-col gap-3 max-w-2xl">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-foreground/20 bg-card px-3.5 py-1 text-caption font-semibold tracking-wider text-foreground uppercase shadow-[1px_1px_0px_0px_#262626]">
          <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
          Creative Studio
        </div>
        <h1 className="text-heading-lg md:text-display font-semibold text-foreground tracking-tight leading-tight">
          Turn your idea into a <em className="font-serif italic font-normal text-foreground">statement</em>.
        </h1>
        <p className="text-body text-muted-ink max-w-xl leading-relaxed">
          Describe a concept, select an art direction, and render 4 unique 1-of-1 shirt prints. Private until you choose to list.
        </p>
      </div>

      {/* Main Studio Form */}
      <CreateForm
        initialPrompt={prompt ?? null}
        initialStyleSlug={initialStyleSlug}
        imagesPerJob={IMAGES_PER_JOB}
        dailyImageCap={DAILY_IMAGE_CAP}
        garmentOptions={garmentOptions}
        userPersonas={userPersonas}
      />
    </div>
  );
}
