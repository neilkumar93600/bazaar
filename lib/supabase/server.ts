import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component with no request context to write to;
            // safe to ignore when middleware is refreshing the session
          }
        },
      },
    },
  );
}

/** Service-role client: no cookies, no RLS, no session. For trusted server
 *  code acting on a user's behalf where there is no user session to act
 *  under — a Stripe webhook is the extreme case, since it arrives from
 *  stripe.com with no browser attached at all.
 *
 *  ponytail: order-actions.ts, app/api/generate and lib/printify/sync each
 *  still spell this out inline. Fold them in next time one is touched. */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
