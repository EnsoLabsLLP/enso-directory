"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import MediaField from "./MediaField";
import MultiSelect from "./MultiSelect";
import {
  CONCERNS, CONCERN_GROUPS, CLIENTS, CLIENT_GROUPS, WAYS, WAY_GROUPS, LANGUAGES, FEATURED_LANGUAGES,
  TIMES, EXPERIENCE, BADGE_PRESETS, findTime
} from "@/lib/catalog";

const splitText = (s) => String(s || "").split(/[;\n]/).map((x) => x.trim()).filter(Boolean);

const CONCERN_OPTIONS = CONCERNS.map((c) => ({ value: c.label, label: c.label, group: c.category, icon: c.icon, description: c.description, keys: [c.id, ...c.aliases] }));
const CLIENT_OPTIONS = CLIENTS.map((c) => ({ value: c.label, label: c.label, group: c.category, icon: c.icon, description: c.description, meta: c.ages ? `Ages ${c.ages}` : "", keys: [c.id, ...c.aliases] }));
const WAY_OPTIONS = WAYS.map((w) => ({ value: w.short, chip: w.short, label: w.name, group: w.category, icon: w.icon, description: w.description, keys: [w.id, w.short, ...w.aliases] }));
const LANGUAGE_GROUPS = [{ id: "common", label: "Most used" }, { id: "more", label: "More languages" }];
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  value: l.label, label: l.label, meta: l.native !== l.label ? l.native : "", group: FEATURED_LANGUAGES.includes(l.label) ? "common" : "more", keys: [l.id, ...l.aliases]
}));
const BADGE_OPTIONS = BADGE_PRESETS.map((b) => ({ value: b, label: b, icon: /advis/i.test(b) ? "user-star" : "rosette-discount-check" }));

export default function PractitionerForm({ initial, uploads }) {
  const router = useRouter();
  const isNew = !initial;
  const r = initial || {};

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
    badges: r.badges || [],
    concerns: r.concerns || [],
    clients: r.clients || [],
    ways: r.ways || [],
    languages: r.languages || [],
    avail: (r.avail || []).map((l) => findTime(l)?.label).filter(Boolean),
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
  const setList = (key) => (list) => setF((s) => ({ ...s, [key]: list }));

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
      badges: f.badges,
      concerns: f.concerns,
      clients: f.clients,
      ways: f.ways,
      languages: f.languages,
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
        {error && <p className="a-notice err" role="alert"><Icon name="alert-circle" />{error}</p>}

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
          <div className="field">
            <label htmlFor="badges" className="sr">Badges</label>
            <p className="hint" id="badgesHint">Badges show in green on the listing. Only add credentials you've checked. &quot;Creative therapies&quot; is added on its own when they offer a creative or expressive therapy.</p>
            <MultiSelect id="badges" describedBy="badgesHint" options={BADGE_OPTIONS} value={f.badges} onChange={setList("badges")} placeholder="Pick a badge or type your own" />
          </div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Expertise</legend>
          <div className="field">
            <label htmlFor="concerns">Can help with</label>
            <p className="hint" id="concernsHint">Concerns and conditions they work with. Search, or type something that isn&apos;t listed.</p>
            <MultiSelect id="concerns" describedBy="concernsHint" options={CONCERN_OPTIONS} groups={CONCERN_GROUPS} value={f.concerns} onChange={setList("concerns")} placeholder="Search concerns, e.g. anxiety, OCD, grief" />
          </div>
          <div className="field">
            <label htmlFor="clients">I work with</label>
            <p className="hint" id="clientsHint">Who they see: session format, age groups and the communities they have experience with.</p>
            <MultiSelect id="clients" describedBy="clientsHint" options={CLIENT_OPTIONS} groups={CLIENT_GROUPS} value={f.clients} onChange={setList("clients")} placeholder="Search, e.g. couples, adolescents, new mothers" />
          </div>
          <div className="field">
            <label htmlFor="ways">Ways of working</label>
            <p className="hint" id="waysHint">Approaches they use. Tap &quot;+ in training&quot; on any they&apos;re still training in.</p>
            <MultiSelect id="ways" describedBy="waysHint" options={WAY_OPTIONS} groups={WAY_GROUPS} value={f.ways} onChange={setList("ways")} training placeholder="Search approaches, e.g. CBT, EMDR, art therapy" />
          </div>
        </fieldset>

        <fieldset className="pf-card">
          <legend>Languages and availability</legend>
          <div className="field">
            <label htmlFor="languages">Languages</label>
            <MultiSelect id="languages" options={LANGUAGE_OPTIONS} groups={LANGUAGE_GROUPS} value={f.languages} onChange={setList("languages")} placeholder="Search languages" />
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
              <button type="button" className="btn ghost sm" onClick={() => setConfirmDelete(true)}><Icon name="trash" />Delete practitioner</button>
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
