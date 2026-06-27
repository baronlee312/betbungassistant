import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");

  if (tag) {
    try {
      revalidateTag(tag, { expire: 0 }); // Expire immediately for immediate updates
      return Response.json({ revalidated: true, now: Date.now(), tag });
    } catch (e: any) {
      return Response.json({
        revalidated: false,
        error: e?.message || String(e),
      }, { status: 500 });
    }
  }

  return Response.json({
    revalidated: false,
    now: Date.now(),
    message: "Missing tag search parameter",
  }, { status: 400 });
}
