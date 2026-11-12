// Development only: saves uploads to .data/uploads when Vercel Blob isn't connected.
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { guard, fail } from "@/lib/admin-api";
import { uploadMode } from "@/lib/store";
import { UPLOAD_DIR } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  if (uploadMode() !== "local") return fail("Uploads go to Vercel Blob on this site.");
  if (process.env.VERCEL) return fail("Connect a Vercel Blob store to upload files on Vercel.", 503);
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return fail("Choose a file to upload.");
  const ext = (path.extname(file.name) || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (![".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"].includes(ext)) return fail("Use a JPG, PNG or WebP photo, or an MP4, MOV or WebM video.");
  const name = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true, url: `/media/${name}` });
}
