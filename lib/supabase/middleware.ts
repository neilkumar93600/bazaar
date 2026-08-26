import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth/next-url";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session token if expired — required so Server Components
  // (which can only read cookies, not write them) see a valid session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    // Carry the destination so auth can finish the trip the visitor started.
    // Without this a person who typed a prompt into the home hero and pressed
    // "Generate my design" was bounced here and then dropped on the homepage,
    // with their draft stranded in sessionStorage.
    //
    // /create is where that hero button lands — a new-visitor action — so it
    // opens signup; /dashboard is a returning-user surface and opens login.
    // Both pages cross-link to the other and carry `next` along.
    const target = pathname.startsWith("/create") ? "/signup" : "/login";
    const url = new URL(target, request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    // The feed, not the dashboard: the product's front door is the bazaar —
    // unless they were headed somewhere specific before the gate stopped them.
    const next = safeNext(request.nextUrl.searchParams.get("next"), "/");
    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}

// `/create` sits in the (public) route group for its chrome, not because it is
// public — generation needs an account, so it is gated here like any other.
const PROTECTED_ROUTES = ["/dashboard", "/create"];
const AUTH_ROUTES = ["/login", "/signup"];
