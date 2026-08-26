import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";
import { storagePathFromUrl } from "@/lib/images/storage-path";
import { watermarkedPreview } from "@/lib/images/watermark";

/** The artwork, watermarked. Always. For everyone.
 *
 *  The flat art is the product. It used to be served straight from a public
 *  storage URL at full print resolution — 1728x2304 on a real row — so anyone
 *  who opened a design page could take a file good enough to print, and the
 *  page did not even have to be opened: the URL sat in the markup.
 *
 *  Nothing here stops a screenshot, and nothing can. What it does is make the
 *  screenshot worthless: every copy this route can produce is marked and capped
 *  well below print size.
 *
 *  This route deliberately does NOT check who is asking, and that is a security
 *  property rather than an oversight. Every <Image> on the site is rewritten to
 *  `/_next/image?url=/api/design-image/<id>`, so Next's optimiser fetches this
 *  server-side and caches the result under a key that contains the URL and no
 *  cookie. If this route ever returned clean bytes to one signed-in owner, that
 *  clean file would then be served from the optimiser's cache to every
 *  subsequent visitor. Owners get the original from ./original instead, which
 *  is uncacheable and never sits behind the optimiser.
 *
 *  Downloads through the service role rather than the stored public URL, so
 *  turning the bucket private needs no code change and no row rewrite.
 */

const BUCKET = "designs";

/** Ceiling on the `w` a caller may ask for. Without it `?w=4000` hands back
 *  exactly the print-resolution file this route exists to withhold — and
 *  next/image asks for 3840 by default. */
const MAX_PREVIEW_EDGE = 900;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const admin = createServiceClient();
  const { data: design } = await admin
    .from("designs")
    .select("image_url, moderation_status")
    .eq("id", id)
    .maybeSingle();

  if (!design?.image_url || design.moderation_status !== "approved") {
    return new NextResponse("Not found", { status: 404 });
  }

  const path = storagePathFromUrl(design.image_url, BUCKET);
  if (!path) return new NextResponse("Not found", { status: 404 });

  const { data: file, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const requested = Number(request.nextUrl.searchParams.get("w"));
  const maxEdge =
    Number.isFinite(requested) && requested > 0
      ? Math.min(Math.round(requested), MAX_PREVIEW_EDGE)
      : MAX_PREVIEW_EDGE;

  const preview = await watermarkedPreview(
    Buffer.from(await file.arrayBuffer()),
    { maxEdge },
  );

  return new NextResponse(new Uint8Array(preview), {
    headers: {
      "Content-Type": "image/webp",
      // Identical for every caller, so it caches freely — which is only true
      // because the response never depends on who asked.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
    },
  });
}
