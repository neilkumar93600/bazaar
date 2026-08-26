import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { storagePathFromUrl } from "@/lib/images/storage-path";

/** The clean, full-resolution original — owner and maker only.
 *
 *  Deliberately separate from the watermarked route next door rather than a
 *  branch inside it. Every <Image> is rewritten to `/_next/image?url=...`, and
 *  that optimiser caches by URL with no cookie in the key, so a route that
 *  sometimes returns clean bytes would eventually serve them to everyone from
 *  cache. Keeping the clean path on its own URL, uncacheable and never fed to
 *  the optimiser, makes that impossible rather than merely unlikely.
 *
 *  Use it for the owner's download, or with `unoptimized` on an <Image> so the
 *  browser requests it directly and carries the session cookie.
 */

const BUCKET = "designs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Not found", { status: 404 });

  const admin = createServiceClient();
  const { data: design } = await admin
    .from("designs")
    .select("image_url, claimed_by, creator_id, moderation_status")
    .eq("id", id)
    .maybeSingle();

  if (!design?.image_url || design.moderation_status !== "approved") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Owner or maker. Being signed in is not a claim on someone else's art.
  // 404 rather than 403 throughout: a 403 confirms the design exists and who
  // it belongs to, which is more than a stranger needs to know.
  if (user.id !== design.claimed_by && user.id !== design.creator_id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const path = storagePathFromUrl(design.image_url, BUCKET);
  if (!path) return new NextResponse("Not found", { status: 404 });

  const { data: file, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(Buffer.from(await file.arrayBuffer())), {
    headers: {
      "Content-Type": file.type || "image/png",
      // Never shared and never stored: one cached copy of this is the whole
      // failure mode the split exists to prevent.
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
