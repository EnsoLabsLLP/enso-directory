// Issues upload tokens for Vercel Blob so the admin's browser can upload photos and videos directly.
// Lives outside /api/admin so Vercel Blob's completion callback isn't blocked; access is checked below.
import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { adminFromRequest } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITS = {
  photo: { types: ["image/jpeg", "image/png", "image/webp"], max: 10 * 1024 * 1024 },
  video: { types: ["video/mp4", "video/quicktime", "video/webm"], max: 300 * 1024 * 1024 }
};

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (body.type === "blob.generate-client-token" && !(await adminFromRequest(request))) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await adminFromRequest(request))) throw new Error("Not signed in");
        const kind = clientPayload === "video" ? "video" : "photo";
        if (!pathname.startsWith(kind === "video" ? "videos/" : "photos/")) throw new Error("Unexpected upload path");
        return {
          allowedContentTypes: LIMITS[kind].types,
          maximumSizeInBytes: LIMITS[kind].max,
          addRandomSuffix: true
        };
      }
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 400 });
  }
}
