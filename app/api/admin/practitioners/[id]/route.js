import { NextResponse } from "next/server";
import { listPractitioners, savePractitioner, deletePractitioner } from "@/lib/store";
import { cleanRecord } from "@/lib/practitioners";
import { guard, refreshSite, fail, storageError, validate } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    const list = await listPractitioners();
    const current = list.find((p) => p.id === id);
    if (!current) return fail("That practitioner no longer exists.", 404);
    const rec = cleanRecord({ ...current, ...body, id });
    const problem = validate(rec);
    if (problem) return fail(problem);
    rec.updated = new Date().toISOString();
    await savePractitioner(rec);
    refreshSite();
    return NextResponse.json({ ok: true, practitioner: rec });
  } catch (e) {
    return storageError(e);
  }
}

export async function DELETE(request, { params }) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    const gone = await deletePractitioner(id);
    if (!gone) return fail("That practitioner no longer exists.", 404);
    refreshSite();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return storageError(e);
  }
}
