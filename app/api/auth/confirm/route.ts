import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // `recovery` is the one type where a plain GET verifying on arrival is a
  // real problem, not just a theoretical one: observed directly in this
  // project's own auth logs — a mail client (or a security scanner) fetches
  // every link in an email before a human ever taps one, and Supabase's
  // recovery token is single-use, so that silent fetch burns it. The human's
  // real click then hits "Email link is invalid or has expired" against a
  // link that is, from their side, brand new.
  //
  // The fix is the one Supabase's own docs recommend for this: don't verify
  // on the bare GET. Forward token_hash/type/next to a page that requires an
  // actual click before it calls verifyOtp. A passive prefetch fetches that
  // page too, but it never clicks a button, so it can no longer consume the
  // token before the person it was sent to does.
  //
  // Other types (signup, email change, invite) keep verifying immediately —
  // this is the only one reported broken, and narrowing the fix to it is
  // narrowing the risk of it too.
  if (type === "recovery" && token_hash) {
    const confirmUrl = new URL("/reset-password/confirm", origin);
    confirmUrl.searchParams.set("token_hash", token_hash);
    confirmUrl.searchParams.set("type", type);
    confirmUrl.searchParams.set("next", next);
    return NextResponse.redirect(confirmUrl);
  }

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
