import { NextResponse } from "next/server";
import { listPractitioners, savePractitioner } from "@/lib/store";
import { cleanRecord, slugify, sortRecords } from "@/lib/practitioners";
import { guard, refreshSite, fail, storageError, validate } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, practitioners: sortRecords(await listPractitioners()) });
  } catch (e) {
    return storageError(e);
  }
}

export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const rec = cleanRecord({ ...body, id: slugify(body.id || body.name) });
  const problem = validate(rec);
  if (problem) return fail(problem);
  try {
    const list = await listPractitioners();
    const taken = new Set(list.map((p) => p.id));
    let id = rec.id, n = 2;
    while (taken.has(id)) id = `${rec.id}-${n++}`;
    rec.id = id;
    if (rec.order === 999) rec.order = list.length ? Math.max(...list.map((p) => (p.order === 999 ? 0 : p.order))) + 1 : 1;
    rec.updated = new Date().toISOString();
    await savePractitioner(rec);
    refreshSite();
    return NextResponse.json({ ok: true, practitioner: rec });
  } catch (e) {
    return storageError(e);
  }
}
