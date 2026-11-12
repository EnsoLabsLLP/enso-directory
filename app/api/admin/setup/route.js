import { NextResponse } from "next/server";
import { setup } from "@/lib/store";
import { guard, refreshSite, storageError } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Creates the Practitioners and Requests tabs (with headers) and loads the starter listings if the sheet is empty.
export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const result = await setup();
    refreshSite();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return storageError(e);
  }
}
