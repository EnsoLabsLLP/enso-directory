// Public endpoint: booking and "Help me choose" requests from the directory.
import { NextResponse } from "next/server";
import { appendRequest, listPractitioners } from "@/lib/store";
import { istNow } from "@/lib/requests";
import { CONCERNS, FEES } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const bad = (error) => NextResponse.json({ ok: false, error }, { status: 400 });

export async function POST(request) {
  let b;
  try {
    b = await request.json();
  } catch {
    return bad("Something went wrong with the form. Please try again.");
  }
  // Hidden field that only bots fill in.
  if (b.website) return NextResponse.json({ ok: true, id: "RECEIVED" });

  const isMatch = b.type === "match";
  const name = line(b.name, 80);
  const phone = line(b.phone, 24);
  const email = line(b.email, 120);
  if (!name) return bad("Add your name so we know who the request is from.");
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) return bad("Add a phone or WhatsApp number we can reach you on.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Check your email address, or leave it blank.");
  if (b.consent !== true) return bad("Please confirm that we can contact you about this request.");

  let practitioner = "";
  if (!isMatch) {
    try {
      const list = await listPractitioners();
      const p = list.find((x) => x.id === b.practitionerId && x.status !== "Hidden");
      if (!p) return bad("That practitioner isn't taking requests right now.");
      practitioner = p.name;
    } catch (e) {
      console.error(e);
      return NextResponse.json({ ok: false, error: "We couldn't send your request just now. Please try again in a minute." }, { status: 502 });
    }
  }

  const concerns = (Array.isArray(b.concerns) ? b.concerns : [])
    .map((id) => CONCERNS.find((c) => c.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  const record = {
    received: istNow(),
    type: isMatch ? "Help me choose" : "Booking",
    practitioner,
    name,
    phone,
    email,
    time: line(b.time, 40) || "Any time",
    concerns,
    language: line(b.language, 40) || (isMatch ? "Any" : ""),
    budget: FEES.find((f) => f.id === b.budget)?.label || (isMatch ? "Any" : ""),
    message: String(b.message ?? "").trim().slice(0, 1500),
    status: "New",
    requestId: crypto.randomUUID().slice(0, 8).toUpperCase()
  };

  try {
    await appendRequest(record);
  } catch (e) {
    console.error("Saving request failed", e);
    return NextResponse.json({ ok: false, error: "We couldn't send your request just now. Please try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, id: record.requestId });
}
