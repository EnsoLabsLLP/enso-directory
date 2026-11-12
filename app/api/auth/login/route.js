import { NextResponse } from "next/server";
import { checkCredentials, adminConfigured } from "@/lib/credentials";
import { createSession, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "Admin login isn't set up yet. Add ADMIN_EMAIL and ADMIN_PASSWORD in Vercel." }, { status: 503 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {}
  if (!checkCredentials(body.email || "", body.password || "")) {
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({ ok: false, error: "That email and password don't match." }, { status: 401 });
  }
  let token;
  try {
    token = await createSession(String(body.email).trim().toLowerCase());
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Add a SESSION_SECRET of at least 32 characters in Vercel." }, { status: 503 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60
  });
  return res;
}
