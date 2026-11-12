import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminFromRequest } from "./session";

export async function guard(request) {
  const session = await adminFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: "Your session has ended. Sign in again." }, { status: 401 });
  return null;
}

export function refreshSite() {
  revalidateTag("sheets");
  revalidatePath("/");
}

export function fail(error, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function storageError(e) {
  console.error(e);
  const detail = e && e.status === 403
    ? "The app can't open the Google Sheet. Share the sheet with the service account email as an Editor."
    : e && e.status === 404
      ? "The Google Sheet wasn't found. Check GOOGLE_SHEET_ID."
      : "Couldn't reach the Google Sheet. Try again in a minute.";
  return fail(detail, 502);
}

export function validate(rec) {
  if (!rec.name) return "Add the practitioner's name.";
  if (!rec.role) return "Add a title, for example Counselling psychologist.";
  if (!rec.summary) return "Add a short summary for the listing card.";
  if (rec.summary.length > 320) return "Keep the short summary under 320 characters.";
  for (const [key, label] of [["photo", "Photo"], ["video", "Intro video"]]) {
    if (rec[key] && !/^(https:\/\/|\/media\/)/.test(rec[key])) return `${label} link must start with https://`;
  }
  return null;
}

