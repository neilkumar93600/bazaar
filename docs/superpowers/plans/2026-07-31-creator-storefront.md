# Creator Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/CREATOR_STOREFRONT_DESIGN.md`

**Goal:** Replace the `ComingSoon` placeholder at `/creator/[handle]` with a working public storefront — identity panel (avatar, stats, follow, share) sticky-left, claimed-design grid right, empty state for zero claims.

**Architecture:** Server component page fetches everything through one `lib/data/storefront.ts` function, renders a sticky-sidebar layout using two new colocated components (`StorefrontHeader`, `StorefrontGrid`), which in turn use two small client islands (`FollowButton`, `ShareButton`) for the only two interactive bits. A new RLS policy makes profile lookups by handle possible at all (previously self-only). New Pietra design tokens are added additively to `globals.css` (no existing token renamed or removed), and the storefront page renders as a light-themed island — `bg-white text-black` on its own content area — inside the otherwise-unchanged dark Navbar/Footer chrome.

**Tech Stack:** Next.js 16 (App Router, typed routes), Supabase (`@supabase/ssr`), Tailwind v4, `date-fns` (already a dependency), existing shadcn-style primitives in `components/ui/`.

## Global Constraints

- No test runner is installed in this repo (only `tsc`, `eslint`, `prettier` — see `package.json`). Every task's "test" step is `npm run typecheck` + `npm run lint`, plus one manual dev-server/Playwright check at the end of the task list covering all states. Do not add a test framework as part of this plan.
- Font weights loaded: Inter 300/400/500 only (`app/layout.tsx`). Never use `font-bold` (700) — it renders as synthetic/faux bold. Anywhere the spec or DESIGN.md says "Labil-Bold", use `font-medium` (500).
- New Pietra CSS tokens are **additive only** — never rename, remove, or repurpose an existing token in `app/globals.css` (e.g. `--primary`, `--background`, `bg-ember`). Every other page keeps rendering exactly as it does today.
- The storefront page's own content wrapper is `bg-white text-black` (a deliberate light island). Navbar/Footer are untouched and stay dark. Do not attempt to reconcile this — it's a known, accepted visual seam for this page only.
- The `supabase/migrations/*.sql` file this plan adds must be reviewed by you, but only actually pushed to the live project (`supabase db push`) with explicit user go-ahead — never run it unattended, since it's a live shared database.
- `storefronts` table (with its own `slug`) is **not** used for routing — the route stays keyed on `profiles.handle` directly, per the resolved open question in the spec.

---

### Task 1: Public profile-read RLS policy

**Files:**
- Create: `supabase/migrations/20260731010000_public_profile_read.sql`

**Interfaces:**
- Produces: a new permissive `select` policy on `public.profiles` so any client (anon or authenticated) can read any row. Nothing consumes this directly in code — Task 3's Supabase queries rely on it being applied to the live database before they'll return data for handles other than the logged-in user's own.

- [ ] **Step 1: Write the migration**

```sql
-- Storefronts need to look up any profile by handle (not just the logged-in
-- user's own row). profiles has no sensitive columns (handle, display_name,
-- avatar_url, created_at, id are all meant to be publicly visible on a
-- storefront/feed) so a plain public select policy is correct here — this
-- adds to, not replaces, the existing self-only policies.
create policy "profiles_select_public" on public.profiles
  for select using (true);
```

Save as `supabase/migrations/20260731010000_public_profile_read.sql`.

- [ ] **Step 2: Verify the file is valid SQL and matches migration-file conventions**

Compare against `supabase/migrations/20260731000000_init_schema.sql`'s style (lower-case keywords, `public.` prefix, trailing semicolon). Confirm the filename timestamp sorts after the existing migration.

- [ ] **Step 3: Ask the user to push it**

Do not run `supabase db push` yourself. Tell the user the migration is ready and ask them to run it (or run it yourself only after they explicitly say to).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260731010000_public_profile_read.sql
git commit -m "feat: allow public read of profiles for storefront lookups"
```

---

### Task 2: Pietra design tokens in globals.css + coral Button variant

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ui/button.tsx`

**Interfaces:**
- Produces: Tailwind utility classes `bg-ember-coral`, `text-ember-coral`, `border-ember-coral`, `bg-cream-paper`, `text-charcoal`, `border-charcoal`, `text-mid-gray`, `border-silver`, `bg-category-royal`, `bg-category-sky`, `bg-category-verdant`, `bg-category-magenta`, `bg-category-sunrise`; plain CSS vars `--shadow-storefront-card` / `--shadow-storefront-card-hover` (used via `shadow-[var(--shadow-storefront-card)]`); and a new `Button` `variant="coral"`.
- Consumes: nothing from earlier tasks.

- [ ] **Step 1: Add Pietra color + gradient tokens**

In `app/globals.css`, inside the existing `@theme inline { ... }` block, immediately after the `--background-image-footer-rose` gradient definition (before the "Type scale" comment), add:

```css
    /* Pietra storefront tokens (docs/CREATOR_STOREFRONT_DESIGN.md) — scoped
       to the creator storefront page only, which renders as a light-themed
       island inside the otherwise all-dark shell (Navbar/Footer unchanged).
       Additive only: not a site-wide palette migration. */
    --color-ember-coral: #ff5c3c;
    --color-cream-paper: #f8f6f2;
    --color-charcoal: #141414;
    --color-mid-gray: #6b6b6b;
    --color-silver: #c4c4c4;
    --background-image-category-royal: radial-gradient(127.58% 127.5% at 25.04% 20.84%, rgb(83, 90, 255) 0%, rgb(125, 51, 247) 100%);
    --background-image-category-sky: radial-gradient(208.48% 182.32% at -0.04% -0.23%, rgb(65, 175, 255) 0%, rgb(72, 101, 255) 100%);
    --background-image-category-verdant: radial-gradient(213.37% 213.37% at 27.54% 0%, rgb(113, 206, 81) 0%, rgb(50, 203, 139) 100%);
    --background-image-category-magenta: radial-gradient(127.58% 127.5% at 25.04% 20.84%, rgb(200, 83, 255) 0%, rgb(247, 51, 239) 100%);
    --background-image-category-sunrise: linear-gradient(43deg, rgb(255, 74, 74) 26.92%, rgb(233, 170, 75) 77.91%);
```

- [ ] **Step 2: Add the two storefront shadow variables**

In `app/globals.css`, immediately after the closing `}` of the `:root, .dark { ... }` block (after line with `--sidebar-ring: #077ac7;` and its closing brace), add a new plain `:root` block — deliberately **not** inside `@theme`, so it never overrides Tailwind's default `--shadow-*` scale used by every other shadcn component on the site:

```css
/* Pietra storefront shadows (docs/CREATOR_STOREFRONT_DESIGN.md) — plain
   custom properties, not registered under Tailwind's --shadow-* theme
   namespace, so they never override the default shadow scale used
   elsewhere. Applied via arbitrary-value utilities, e.g.
   shadow-[var(--shadow-storefront-card)]. */
:root {
    --shadow-storefront-card: rgba(239, 227, 225, 0.3) 5px 5px 24px 0px;
    --shadow-storefront-card-hover: rgba(134, 137, 141, 0.2) 0px 0px 40px 0px;
}
```

- [ ] **Step 3: Add the coral Button variant**

In `components/ui/button.tsx`, in the `buttonVariants` cva `variants.variant` object, add a new entry right after `default`:

```ts
        coral: "bg-ember-coral text-white hover:brightness-110",
```

- [ ] **Step 4: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 5: Visual smoke check**

Run `npm run dev`, temporarily drop `<div className="bg-ember-coral p-4 text-white">test</div>` into any page, confirm it renders coral (`#ff5c3c`) not a fallback/unstyled box, then remove the test div.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css components/ui/button.tsx
git commit -m "feat: add Pietra design tokens and coral button variant"
```

---

### Task 3: Storefront data layer

**Files:**
- Create: `lib/data/storefront.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (existing).
- Produces: `getStorefrontData(handle: string): Promise<StorefrontData | null>`, and the types `StorefrontProfile`, `StorefrontDesign`, `StorefrontData` — these are the exact names/shapes every later task imports.

- [ ] **Step 1: Write the file**

```ts
import { createClient } from "@/lib/supabase/server";

export type StorefrontProfile = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type StorefrontDesign = {
  id: string;
  imageUrl: string;
  claimedAt: string;
  vibe: { name: string; slug: string } | null;
};

export type StorefrontData = {
  profile: StorefrontProfile;
  followerCount: number;
  designs: StorefrontDesign[];
  claimedSince: string | null;
  isFollowing: boolean;
  isOwnProfile: boolean;
  viewerIsLoggedIn: boolean;
};

export async function getStorefrontData(
  handle: string,
): Promise<StorefrontData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return null;

  const followRowPromise =
    user && user.id !== profile.id
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followed_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { follower_id: string } | null });

  const [{ count: followerCount }, { data: claims }, { data: followRow }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", profile.id),
      supabase
        .from("claims")
        .select("design_id, claimed_at")
        .eq("claimant_id", profile.id)
        .order("claimed_at", { ascending: true }),
      followRowPromise,
    ]);

  const claimList = claims ?? [];
  const designIds = claimList.map((c) => c.design_id);

  const { data: designRows } = designIds.length
    ? await supabase
        .from("designs")
        .select("id, image_url, vibe_id")
        .in("id", designIds)
        .eq("moderation_status", "approved")
    : { data: [] };

  const vibeIds = [
    ...new Set(
      (designRows ?? [])
        .map((d) => d.vibe_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const { data: vibeRows } = vibeIds.length
    ? await supabase.from("vibes").select("id, name, slug").in("id", vibeIds)
    : { data: [] };

  const vibeById = new Map((vibeRows ?? []).map((v) => [v.id, v]));
  const claimedAtByDesignId = new Map(
    claimList.map((c) => [c.design_id, c.claimed_at]),
  );

  const designs: StorefrontDesign[] = (designRows ?? [])
    .map((d) => ({
      id: d.id,
      imageUrl: d.image_url,
      claimedAt: claimedAtByDesignId.get(d.id)!,
      vibe: d.vibe_id ? (vibeById.get(d.vibe_id) ?? null) : null,
    }))
    .sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1));

  return {
    profile: {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    },
    followerCount: followerCount ?? 0,
    designs,
    claimedSince: claimList.length > 0 ? claimList[0].claimed_at : null,
    isFollowing: Boolean(followRow),
    isOwnProfile: user?.id === profile.id,
    viewerIsLoggedIn: Boolean(user),
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors. This is the main correctness check available (no test runner) — the branching logic (no profile, zero claims, viewer states) gets exercised end-to-end in Task 8's manual verification once the page exists.

- [ ] **Step 3: Commit**

```bash
git add lib/data/storefront.ts
git commit -m "feat: add storefront data-fetching layer"
```

---

### Task 4: Follow toggle server action + FollowButton

**Files:**
- Create: `app/(marketing)/creator/[handle]/actions.ts`
- Create: `app/(marketing)/components/FollowButton.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks except the existing `Button` component (now with `variant="coral"` from Task 2).
- Produces: `toggleFollow(profileId: string, handle: string): Promise<{ isFollowing: boolean }>`; `<FollowButton profileId isOwnProfile isLoggedIn initialIsFollowing handle />` — this exact prop list is what Task 6 (`StorefrontHeader`) renders.

- [ ] **Step 1: Write the server action**

```ts
"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function toggleFollow(profileId: string, handle: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be signed in to follow.");
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followed_id", profileId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followed_id", profileId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, followed_id: profileId });
  }

  revalidatePath(`/creator/${handle}`);

  return { isFollowing: !existing };
}
```

- [ ] **Step 2: Write the client FollowButton**

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/(marketing)/creator/[handle]/actions";

export function FollowButton({
  profileId,
  handle,
  initialIsFollowing,
  isOwnProfile,
  isLoggedIn,
}: {
  profileId: string;
  handle: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  if (isOwnProfile) return null;

  if (!isLoggedIn) {
    return (
      <Button variant="coral" render={<Link href="/login" />}>
        Follow
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "coral"}
      disabled={isPending}
      onClick={() => {
        const optimisticNext = !isFollowing;
        setIsFollowing(optimisticNext);
        startTransition(async () => {
          const result = await toggleFollow(profileId, handle);
          setIsFollowing(result.isFollowing);
        });
      }}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)/creator/[handle]/actions.ts" "app/(marketing)/components/FollowButton.tsx"
git commit -m "feat: add follow toggle action and FollowButton"
```

---

### Task 5: ShareButton

**Files:**
- Create: `app/(marketing)/components/ShareButton.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`.
- Produces: `<ShareButton handle={string} />` — rendered by Task 6.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/creator/${handle}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <>
          <Check /> Copied
        </>
      ) : (
        <>
          <Share2 /> Share
        </>
      )}
    </Button>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/components/ShareButton.tsx"
git commit -m "feat: add ShareButton"
```

---

### Task 6: StorefrontHeader

**Files:**
- Create: `app/(marketing)/components/StorefrontHeader.tsx`

**Interfaces:**
- Consumes: `StorefrontData` type from `@/lib/data/storefront` (Task 3); `FollowButton` (Task 4); `ShareButton` (Task 5); `date-fns`'s `format`.
- Produces: `<StorefrontHeader data={StorefrontData} />` — rendered by Task 8's page.

- [ ] **Step 1: Write the component**

```tsx
import Image from "next/image";
import { format } from "date-fns";

import type { StorefrontData } from "@/lib/data/storefront";
import { FollowButton } from "./FollowButton";
import { ShareButton } from "./ShareButton";

export function StorefrontHeader({ data }: { data: StorefrontData }) {
  const {
    profile,
    followerCount,
    designs,
    claimedSince,
    isFollowing,
    isOwnProfile,
    viewerIsLoggedIn,
  } = data;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 text-black shadow-[var(--shadow-storefront-card)] lg:sticky lg:top-[90px] lg:h-fit lg:w-[320px] lg:shrink-0">
      <div className="flex items-center gap-4">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            width={96}
            height={96}
            className="size-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-cream-paper text-[24px] font-medium text-charcoal">
            {profile.handle.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[24px] font-medium tracking-[-0.24px]">
            @{profile.handle}
          </span>
          {profile.displayName && (
            <span className="text-[14px] text-mid-gray">
              {profile.displayName}
            </span>
          )}
        </div>
      </div>

      <div className="text-[14px] text-mid-gray">
        {followerCount} follower{followerCount === 1 ? "" : "s"} ·{" "}
        {designs.length} design{designs.length === 1 ? "" : "s"}
        {claimedSince && (
          <> · claiming since {format(new Date(claimedSince), "MMM yyyy")}</>
        )}
      </div>

      <div className="flex gap-2">
        <FollowButton
          profileId={profile.id}
          handle={profile.handle}
          initialIsFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          isLoggedIn={viewerIsLoggedIn}
        />
        <ShareButton handle={profile.handle} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/components/StorefrontHeader.tsx"
git commit -m "feat: add StorefrontHeader"
```

---

### Task 7: StorefrontDesignCard + StorefrontGrid

**Files:**
- Create: `app/(marketing)/components/StorefrontDesignCard.tsx`
- Create: `app/(marketing)/components/StorefrontGrid.tsx`

**Interfaces:**
- Consumes: `StorefrontDesign`, `StorefrontData` types (Task 3); `cn`, `hueFromString` from `@/lib/utils` (existing); `Empty`/`EmptyHeader`/`EmptyTitle`/`EmptyDescription`/`EmptyContent`/`EmptyMedia` from `@/components/ui/empty` (existing); `Button` (existing); `.animate-card-rise` / `.stagger-N` classes (existing, `app/globals.css`).
- Produces: `<StorefrontGrid data={StorefrontData} />` — rendered by Task 8's page.

- [ ] **Step 1: Write StorefrontDesignCard**

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";

import type { StorefrontDesign } from "@/lib/data/storefront";
import { cn, hueFromString } from "@/lib/utils";

const CATEGORY_GRADIENT_CLASSES = [
  "bg-category-royal",
  "bg-category-sky",
  "bg-category-verdant",
  "bg-category-magenta",
  "bg-category-sunrise",
];

const STAGGER_CLASSES = Array.from({ length: 12 }, (_, i) => `stagger-${i}`);

export function StorefrontDesignCard({
  design,
  index,
}: {
  design: StorefrontDesign;
  index: number;
}) {
  const gradientClass = design.vibe
    ? CATEGORY_GRADIENT_CLASSES[
        hueFromString(design.vibe.slug) % CATEGORY_GRADIENT_CLASSES.length
      ]
    : null;

  return (
    <Link
      href={`/design/${design.id}`}
      className={cn(
        "animate-card-rise group flex flex-col gap-2 rounded-xl bg-white p-3 text-black shadow-[var(--shadow-storefront-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-storefront-card-hover)]",
        index < STAGGER_CLASSES.length && STAGGER_CLASSES[index],
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 300px, 45vw"
          className="object-cover"
        />
        {design.vibe && gradientClass && (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-2.5 py-1 text-[12px] font-medium text-white",
              gradientClass,
            )}
          >
            {design.vibe.name}
          </span>
        )}
      </div>
      <span className="text-[12px] text-mid-gray">
        Claimed{" "}
        {formatDistanceToNowStrict(new Date(design.claimedAt), {
          addSuffix: true,
        })}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Write StorefrontGrid**

```tsx
import Link from "next/link";
import { ShirtIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { StorefrontData } from "@/lib/data/storefront";
import { StorefrontDesignCard } from "./StorefrontDesignCard";

export function StorefrontGrid({ data }: { data: StorefrontData }) {
  if (data.designs.length === 0) {
    return (
      <Empty className="flex-1 bg-white text-black">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShirtIcon />
          </EmptyMedia>
          <EmptyTitle>No designs claimed yet</EmptyTitle>
          <EmptyDescription>
            Designs @{data.profile.handle} claims will show up here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link href="/" />}>
            Browse designs
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.designs.map((design, index) => (
        <StorefrontDesignCard key={design.id} design={design} index={index} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)/components/StorefrontDesignCard.tsx" "app/(marketing)/components/StorefrontGrid.tsx"
git commit -m "feat: add StorefrontDesignCard and StorefrontGrid"
```

---

### Task 8: Page assembly

**Files:**
- Modify: `app/(marketing)/creator/[handle]/page.tsx`

**Interfaces:**
- Consumes: `getStorefrontData` (Task 3), `StorefrontHeader` (Task 6), `StorefrontGrid` (Task 7).
- Produces: the finished route. Nothing downstream depends on this file.

- [ ] **Step 1: Replace the placeholder**

```tsx
import { notFound } from "next/navigation";

import { getStorefrontData } from "@/lib/data/storefront";
import { StorefrontGrid } from "@/app/(marketing)/components/StorefrontGrid";
import { StorefrontHeader } from "@/app/(marketing)/components/StorefrontHeader";

export default async function CreatorStorefrontPage(
  props: PageProps<"/creator/[handle]">,
) {
  const { handle } = await props.params;
  const data = await getStorefrontData(handle);

  if (!data) notFound();

  return (
    <div className="bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-12">
        <StorefrontHeader data={data} />
        <StorefrontGrid data={data} />
      </div>
    </div>
  );
}
```

This fully replaces the file's previous `ComingSoon`-based content — delete the old import and body.

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/creator/[handle]/page.tsx"
git commit -m "feat: build creator storefront page"
```

---

### Task 9: Manual verification pass

No new files — this task exercises everything built in Tasks 1-8 together. Requires Task 1's migration to have been pushed to the database (ask the user to confirm before starting this task), and at least one seeded profile with zero claims and one with 1+ claims (check `supabase/seed.sql`; add rows there if it doesn't already cover both cases — ask the user before modifying seed data on a shared project).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Empty-state check**

Navigate to `/creator/<handle-with-zero-claims>`. Expected: header renders with real avatar/handle, stats show "0 followers · 0 designs" with no "claiming since" clause, grid area shows the empty state with a working "Browse designs" link to `/`.

- [ ] **Step 3: Populated-grid check**

Navigate to `/creator/<handle-with-claims>`. Expected: cards render in a 3/2/1-column responsive grid, each shows image, vibe gradient tag (if the design has a vibe), "Claimed X ago" line, and clicking a card navigates to `/design/[id]`. Cards fade/slide in on load (staggered).

- [ ] **Step 4: 404 check**

Navigate to `/creator/definitely-not-a-real-handle`. Expected: Next.js not-found page, not a blank/empty storefront.

- [ ] **Step 5: Follow flow — logged out**

While logged out, visit any other profile's storefront. Expected: Follow button renders coral, clicking it navigates to `/login` (no request is made to `toggleFollow`).

- [ ] **Step 6: Follow flow — logged in, other profile**

Log in, visit a different profile's storefront. Click Follow: button should flip to "Following" (outline style) immediately, and the follower count on a page refresh should have incremented. Click again to unfollow, confirm it reverts and the count decrements.

- [ ] **Step 7: Own-profile check**

Visit your own storefront while logged in. Expected: no Follow button rendered at all; Share button still renders.

- [ ] **Step 8: Share check**

Click Share. Expected: label swaps to "Copied" for ~1.5s then reverts; paste the clipboard contents somewhere to confirm it's the correct `/creator/<handle>` URL.

- [ ] **Step 9: Responsive check**

Resize the browser (or use Playwright's `browser_resize`) to a mobile width. Expected: identity panel stacks above the grid (no longer sticky/side-by-side), grid drops to 1 column.

- [ ] **Step 10: Reduced-motion check**

Enable "prefers-reduced-motion: reduce" (browser dev tools or OS setting) and reload the populated storefront. Expected: cards appear without the fade/slide animation (per the existing `@media (prefers-reduced-motion: reduce)` rule on `.animate-card-rise` in `app/globals.css`).

No commit for this task — it's verification only. If any check fails, fix the relevant task's code and re-run the failed check.

---

## Self-Review Notes

- **Spec coverage:** Identity panel (Task 6), grid + cards (Task 7), empty state (Task 7), motion (reused existing `.animate-card-rise`/`.stagger-N`, no new task needed), follow (Task 4), share (Task 5), page assembly + 404 (Task 8), data needs (Task 3), the RLS gap the spec didn't know about (Task 1) — all covered.
- **Deviations from the spec, made during planning and worth restating:** dropped "price" from the design card (no such field exists anywhere in the schema); "bio line" is `profiles.display_name`, not a dedicated bio field (none exists); confirmed the light-theme-island visual seam explicitly rather than let it surface as a surprise during implementation.
- **Type consistency:** `StorefrontData`/`StorefrontProfile`/`StorefrontDesign` (Task 3) are the only types referenced by name in Tasks 4, 6, and 7 — checked field names (`profileId`, `handle`, `initialIsFollowing`, `isOwnProfile`, `isLoggedIn` for `FollowButton`; `data: StorefrontData` for `StorefrontHeader`/`StorefrontGrid`) match across every task that produces vs. consumes them.
