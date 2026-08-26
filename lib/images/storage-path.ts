/** The object path inside a Supabase Storage bucket, recovered from a stored URL.
 *
 *  Existing rows hold whole public URLs — `getPublicUrl()` was called at write
 *  time and the result persisted. Downloading through the service role instead
 *  needs the path alone, and deriving it here means the bucket can be flipped
 *  to private without rewriting a single row.
 *
 *  Supabase serves objects at:
 *      /storage/v1/object/public/<bucket>/<path...>
 *      /storage/v1/object/sign/<bucket>/<path...>
 *      /storage/v1/object/<bucket>/<path...>
 */
export function storagePathFromUrl(
  url: string,
  bucket: string,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const marker = "/storage/v1/object/";
  const at = parsed.pathname.indexOf(marker);
  if (at === -1) return null;

  let rest = parsed.pathname.slice(at + marker.length);
  for (const prefix of ["public/", "sign/", "authenticated/"]) {
    if (rest.startsWith(prefix)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }

  if (!rest.startsWith(`${bucket}/`)) return null;
  const path = rest.slice(bucket.length + 1);
  if (!path) return null;

  // Percent-decode: an object key with a space arrives as %20 and the storage
  // API wants the real key. A malformed escape means this is not a path we
  // understand, and guessing would fetch the wrong object.
  try {
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}
