"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import MediaField from "./MediaField";
import { CONCERNS, WAYS, TIMES, EXPERIENCE, BADGE_PRESETS } from "@/lib/catalog";

const LANGUAGE_SUGGESTIONS = ["English", "Hindi", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Punjabi", "Urdu"];
const splitText = (s) => String(s || "").split(/[;\n]/).map((x) => x.trim()).filter(Boolean);
const splitLangs = (s) => String(s || "").split(/[;,]/).map((x) => x.trim()).filter(Boolean);

function partition(values, known) {
  const set = new Set(known);
  return { picked: values.filter((v) => set.has(v)), other: values.filter((v) => !set.has(v)).join("; ") };
}

export default function PractitionerForm({ initial, uploads }) {
  const router = useRouter();
  const isNew = !initial;
  const r = initial || {};
  const concernLabels = CONCERNS.map((c) => c.label);
  const wayLabels = WAYS.map((w) => w.short);
  const c0 = partition(r.concerns || [], concernLabels);
  const w0 = partition(r.ways || [], wayLabels);
  const b0 = partition(r.badges || [], BADGE_PRESETS);

  const [f, setF] = useState({
    name: r.name || "",
    role: r.role || "",
    place: r.place || "",
    status: r.status || "Published",
    order: r.order && r.order !== 999 ? String(r.order) : "",
    photo: r.photo || "",
    video: r.video || "",
    summary: r.summary || "",
    about: r.about || "",
    badges: b0.picked,
    otherBadges: b0.other,
    concerns: c0.picked,
    otherConcerns: c0.other,
    ways: w0.picked,
    otherWays: w0.other,
    languages: (r.languages || []).join(", "),
    avail: r.avail || [],
    availNote: r.availNote || "",
    fee: r.fee == null ? "" : String(r.fee),
    exp: r.exp || "",
    education: (r.education || []).join("\n")
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e && e.target ? e.target.value : e }));
  const toggle = (key, value) => setF((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((x) => x !== value) : [...s[key], value] }));
  const addLang = (l) => {
    const now = splitLangs(f.languages);
    if (!now.some((x) => x.toLowerCase() === l.toLowerCase())) setF((s) => ({ ...s, languages: [...now, l].join(", ") }));
  };

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      name: f.name.trim(),
      role: f.role.trim(),
      place: f.place.trim(),
      status: f.status,
      order: f.order,
      photo: f.photo,
      video: f.video,
      summary: f.summary.trim(),
      about: f.about.trim(),
      badges: [...f.badges, ...splitText(f.otherBadges)],
      concerns: [...CONCERNS.map((c) => c.label).filter((l) => f.concerns.includes(l)), ...splitText(f.otherConcerns)],
      ways: [...WAYS.map((w) => w.short).filter((l) => f.ways.includes(l)), ...splitText(f.otherWays)],
      languages: splitLangs(f.languages),
      avail: TIMES.map((t) => t.label).filter((l) => f.avail.includes(l)),
      availNote: f.availNote.trim(),
      fee: f.fee,
      exp: f.exp,
      education: splitText(f.education)
    };
    try {
      const url = isNew ? "/api/admin/practitioners" : `/api/admin/practitioners/${encodeURIComponent(r.id)}`;
      const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save. Try again.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/practitioners/${encodeURIComponent(r.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete. Try again.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const expOptions = EXPERIENCE.map((x) => x.label);
  if (f.exp && !expOptions.includes(f.exp)) expOptions.push(f.exp);

  return (
    <main className="a-wrap a-main">
      <form className="pf" onSubmit={save} noValidate>
        <div className="a-head">
          <div>
            <Link href="/admin" className="a-back">← All practitioners</Link>
            <h1>{isNew ? "Add practitioner" : `Edit ${r.name}`}</h1>
          </div>
          <div className="a-actions">
            <Link href="/admin" className="btn ghost sm">Cancel</Link>
            <button className="btn sm" type="submit" disabled={busy}><Icon name="check" />{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
        {error && <p className="a-notice err" role="alert"><Icon name="circle-alert" />{error}</p>}

        <fieldset className="pf-card">
          <legend>Basics</legend>
          <div className="pf-grid">
            <div className="field"><label htmlFor="name">Full name *</label><input id="name" type="text" value={f.name} onChange={set("name")} maxLength={80} /></div>
            <div className="field"><label htmlFor="role">Title *</label><input id="role" type="text" value={f.role} onChange={set("role")} placeholder="Counselling psychologist" maxLength={80} /></div>
            <div className="field"><label htmlFor="place">Based in</label><input id="place" type="text" value={f.place} onChange={set("place")} placeholder="Mumbai" maxLength={60} /></div>
            <div className="field">
              <label htmlFor="status">Show on the site?</label>
              <div className="select-wrap"><select id="status" value={f.status} onChange={set("status")}><option value="Published">Yes, published</option><option value="Hidden">No, hidden</option></select></div>
            </div>
            <div className="field"><label htmlFor="fee">Session fee (₹)</label><input id="fee" type="number" min="0" step="50" inputMode="numeric" value={f.fee} onChange={set("fee")} placeholder="Leave blank for 'On request'" /></div>
            <div className="field">
              <label htmlFor="exp">Experience</label>
              <div className="select-wrap"><select id="exp" value={f.exp} onChange={set("exp")}><option value="">Not shown</option>{expOptions.map((x) => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div className="field"><label htmlFor="order">Position in the list</label><input id="order" type="number" min="1" value={f.order} onChange={set("order")} placeholder="1 shows first" /></div>
          </div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Photo and intro video</legend>
          <div className="pf-media">
            <MediaField kind="photo" label="Profile photo" value={f.photo} onChange={set("photo")} uploads={uploads} name={f.name} />
            <MediaField kind="video" label="Intro video" value={f.video} onChange={set("video")} uploads={uploads} name={f.name} />
          </div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Listing text</legend>
          <div className="field">
            <label htmlFor="summary">Short summary * <span className="muted">({f.summary.length}/320)</span></label>
            <textarea id="summary" rows={3} maxLength={320} value={f.summary} onChange={set("summary")} placeholder="One or two sentences on who they help and how. Shown on the listing card." />
          </div>
          <div className="field">
            <label htmlFor="about">About, in their own words</label>
            <textarea id="about" rows={6} value={f.about} onChange={set("about")} placeholder="Shown on the full profile. Line breaks are kept." />
          </div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Badges</legend>
          <p className="hint">Badges show in green on the listing. Only add credentials you've checked.</p>
          <div className="pf-checks">
            {BADGE_PRESETS.map((b) => (
              <label key={b} className="pf-check"><input type="checkbox" checked={f.badges.includes(b)} onChange={() => toggle("badges", b)} />{b}</label>
            ))}
          </div>
          <div className="field"><label htmlFor="otherBadges">Other badges</label><input id="otherBadges" type="text" value={f.otherBadges} onChange={set("otherBadges")} placeholder="Separate with semicolons" /></div>
          <p className="hint">"Creative therapies" is added automatically when they offer art, drama, play, music, movement or expressive arts.</p>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Can help with</legend>
          <div className="pf-checks">
            {CONCERNS.map((c) => (
              <label key={c.id} className="pf-check"><input type="checkbox" checked={f.concerns.includes(c.label)} onChange={() => toggle("concerns", c.label)} /><Icon name={c.icon} size={16} />{c.label}</label>
            ))}
          </div>
          <div className="field"><label htmlFor="otherConcerns">Other areas</label><input id="otherConcerns" type="text" value={f.otherConcerns} onChange={set("otherConcerns")} placeholder="For example: OCD; Postpartum support" /></div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Ways of working</legend>
          <div className="pf-checks">
            {WAYS.map((w) => (
              <label key={w.id} className="pf-check" title={w.name}><input type="checkbox" checked={f.ways.includes(w.short)} onChange={() => toggle("ways", w.short)} />{w.short}</label>
            ))}
          </div>
          <div className="field">
            <label htmlFor="otherWays">Other approaches</label>
            <input id="otherWays" type="text" value={f.otherWays} onChange={set("otherWays")} placeholder="Separate with semicolons. Add '(in training)' after an approach they're still training in." />
          </div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Languages and availability</legend>
          <div className="field">
            <label htmlFor="languages">Languages</label>
            <input id="languages" type="text" value={f.languages} onChange={set("languages")} placeholder="English, Hindi" />
            <div className="pf-suggest">
              {LANGUAGE_SUGGESTIONS.filter((l) => !splitLangs(f.languages).some((x) => x.toLowerCase() === l.toLowerCase())).map((l) => (
                <button type="button" key={l} className="fchip" onClick={() => addLang(l)}><Icon name="plus" size={14} />{l}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Usually available</span>
            <div className="pf-checks">
              {TIMES.map((t) => (
                <label key={t.id} className="pf-check"><input type="checkbox" checked={f.avail.includes(t.label)} onChange={() => toggle("avail", t.label)} /><Icon name={t.icon} size={16} />{t.label}</label>
              ))}
            </div>
          </div>
          <div className="field"><label htmlFor="availNote">Availability note</label><input id="availNote" type="text" value={f.availNote} onChange={set("availNote")} placeholder="Also available all day on Mondays" maxLength={160} /></div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Education and registration</legend>
          <div className="field">
            <label htmlFor="education">One per line</label>
            <textarea id="education" rows={4} value={f.education} onChange={set("education")} placeholder={"MA, Clinical Psychology\nRegistered with the Rehabilitation Council of India"} />
          </div>
        </fieldset>

        <div className="pf-foot">
          {!isNew && (
            confirmDelete ? (
              <span className="pf-del">
                <span>Delete {r.name}? This removes their row from the sheet.</span>
                <button type="button" className="btn sm danger" onClick={remove} disabled={busy}>Delete</button>
                <button type="button" className="btn ghost sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </span>
            ) : (
              <button type="button" className="btn ghost sm" onClick={() => setConfirmDelete(true)}><Icon name="trash-2" />Delete practitioner</button>
            )
          )}
          <span className="pf-spacer" />
          <Link href="/admin" className="btn ghost">Cancel</Link>
          <button className="btn" type="submit" disabled={busy}><Icon name="check" />{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </main>
  );
}
