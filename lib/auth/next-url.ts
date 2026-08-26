/** The destination a visitor was headed to before the auth gate stopped them.
 *
 *  Every auth exit — password login, OAuth callback, OTP verification — used to
 *  hardcode where it landed, so someone who typed a prompt into the home hero
 *  and hit "Generate my design" was bounced to auth and then dropped on `/`,
 *  `/dashboard`, or `/create` depending on which door they came back through.
 *  Only one of those is the trip they started. `next` carries it. */

/** Narrows a `next` value to a same-origin relative path.
 *
 *  This is a trust boundary, not a convenience: `next` arrives from the query
 *  string, and an unchecked value turns every auth exit into an open redirect
 *  that phishes with a real login page. Anything that could resolve to another
 *  origin is dropped in favour of the fallback. */
export function safeNext(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value) return fallback;

  // Must be a single-slash relative path. `//evil.com` is protocol-relative and
  // `https://evil.com` is absolute — both resolve off-origin. Backslashes are
  // rejected too because some parsers fold `/\evil.com` into `//evil.com`.
  if (value[0] !== "/") return fallback;
  if (value[1] === "/" || value[1] === "\\") return fallback;

  // A control character can truncate the path or smuggle a second header.
  // Checked by code point rather than a regex class so the escape sequences
  // stay escapes and never become literal control bytes in this file.
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return fallback;
  }

  return value;
}

/** The design prompt a visitor wrote before the auth gate stopped them.
 *
 *  They typed it into the home hero, pressed "Generate my design", and got a
 *  signup form instead — so the auth screens quote it back as proof the work
 *  survived. Returns null when `next` carries no prompt, which is every
 *  destination except /create. */
export function promptFromNext(next: string): string | null {
  const query = next.indexOf("?");
  if (query === -1) return null;

  const prompt = new URLSearchParams(next.slice(query + 1)).get("prompt");
  const trimmed = prompt?.trim();
  return trimmed ? trimmed : null;
}
