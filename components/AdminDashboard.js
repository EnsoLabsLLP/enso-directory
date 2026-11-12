"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

const initials = (n) => {
  const w = String(n || "?").trim().split(/\s+/);
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
};
const fee = (n) => (n == null ? "On request" : "₹" + Number(n).toLocaleString("en-IN"));

export default function AdminDashboard({ initial }) {
  const router = useRouter();
  const [people, setPeople] = useState(initial.practitioners);
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [settingUp, setSettingUp] = useState(false);

  async function call(url, method, body) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      router.replace("/admin/login");
      throw new Error(data.error || "Sign in again.");
    }
    if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong. Try again.");
    return data;
  }

  async function toggle(p) {
    setBusy(p.id);
    setNotice(null);
    try {
      const status = p.status === "Hidden" ? "Published" : "Hidden";
      const { practitioner } = await call(`/api/admin/practitioners/${encodeURIComponent(p.id)}`, "PUT", { status });
      setPeople((list) => list.map((x) => (x.id === p.id ? practitioner : x)));
      setNotice({ kind: "ok", text: `${p.name} is now ${status === "Hidden" ? "hidden from" : "shown on"} the site.` });
    } catch (e) {
      setNotice({ kind: "err", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function remove(p) {
    setBusy(p.id);
    setNotice(null);
    try {
      await call(`/api/admin/practitioners/${encodeURIComponent(p.id)}`, "DELETE");
      setPeople((list) => list.filter((x) => x.id !== p.id));
      setNotice({ kind: "ok", text: `${p.name} was deleted.` });
    } catch (e) {
      setNotice({ kind: "err", text: e.message });
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  }

  async function setup() {
    setSettingUp(true);
    setNotice(null);
    try {
      const r = await call("/api/admin/setup", "POST");
      setNotice({ kind: "ok", text: r.seeded ? `Sheet set up and ${r.seeded} starter listings added.` : "Sheet set up." });
      router.refresh();
    } catch (e) {
      setNotice({ kind: "err", text: e.message });
    } finally {
      setSettingUp(false);
    }
  }

  const shown = people.filter((p) => p.status !== "Hidden").length;

  return (
    <main className="a-wrap a-main">
      {initial.storage === "local" && (
        <div className="a-banner">
          <Icon name="circle-alert" />
          <div>
            <strong>Practice mode.</strong> Listings and requests are saved on this computer only. Add the Google Sheet settings to
            go live (see the README).
          </div>
        </div>
      )}
      {initial.error && (
        <div className="a-banner err">
          <Icon name="circle-alert" />
          <div>{initial.error}</div>
        </div>
      )}
      {!initial.error && !initial.ready && (
        <div className="a-banner">
          <Icon name="sparkles" />
          <div>
            <strong>Your Google Sheet is connected.</strong> Set it up to create the Practitioners and Requests tabs and load the 10
            starter listings.
            <div style={{ marginTop: 10 }}>
              <button className="btn sm" type="button" onClick={setup} disabled={settingUp}>
                {settingUp ? "Setting up…" : "Set up sheet"}
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <p className={`a-notice ${notice.kind}`} role="status">
          <Icon name={notice.kind === "ok" ? "circle-check" : "circle-alert"} />
          {notice.text}
        </p>
      )}

      <section className="a-section">
        <div className="a-head">
          <div>
            <h1>Practitioners</h1>
            <p className="muted">{people.length} listed · {shown} shown on the site</p>
          </div>
          <div className="a-actions">
            {initial.sheetUrl && (
              <a className="btn ghost sm" href={initial.sheetUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="external-link" />Open Google Sheet
              </a>
            )}
            <Link className="btn sm" href="/admin/practitioners/new"><Icon name="plus" />Add practitioner</Link>
          </div>
        </div>

        {people.length === 0 ? (
          <div className="a-empty">
            <Icon name="users-round" size={28} />
            <p>No practitioners yet.</p>
            <Link className="btn sm" href="/admin/practitioners/new"><Icon name="plus" />Add the first one</Link>
          </div>
        ) : (
          <ul className="a-list">
            {people.map((p) => (
              <li key={p.id} className={p.status === "Hidden" ? "is-hidden" : ""}>
                <div className="a-av">{p.photo ? <img src={p.photo} alt="" /> : <span>{initials(p.name)}</span>}</div>
                <div className="a-who">
                  <strong>{p.name}</strong>
                  <span className="muted">{p.role}{p.place ? ` · ${p.place}` : ""}</span>
                  <span className="a-meta">
                    <span className={`a-pill ${p.status === "Hidden" ? "off" : "on"}`}>{p.status === "Hidden" ? "Hidden" : "Published"}</span>
                    <span className={`a-media ${p.photo ? "has" : ""}`} title={p.photo ? "Photo added" : "No photo yet"}><Icon name="image" size={15} />{p.photo ? "Photo" : "No photo"}</span>
                    <span className={`a-media ${p.video ? "has" : ""}`} title={p.video ? "Intro video added" : "No intro video yet"}><Icon name="film" size={15} />{p.video ? "Video" : "No video"}</span>
                    <span className="a-media has">{fee(p.fee)}</span>
                  </span>
                </div>
                <div className="a-row-actions">
                  {confirming === p.id ? (
                    <>
                      <span className="a-confirm">Delete {p.name.split(" ")[0]}? This can't be undone.</span>
                      <button type="button" className="btn sm danger" onClick={() => remove(p)} disabled={busy === p.id}>Delete</button>
                      <button type="button" className="btn ghost sm" onClick={() => setConfirming(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <Link className="btn ghost sm" href={`/admin/practitioners/${encodeURIComponent(p.id)}`}><Icon name="pencil" />Edit</Link>
                      <button type="button" className="btn ghost sm" onClick={() => toggle(p)} disabled={busy === p.id}>
                        <Icon name={p.status === "Hidden" ? "eye" : "eye-off"} />{p.status === "Hidden" ? "Show" : "Hide"}
                      </button>
                      <button type="button" className="iconbtn" onClick={() => setConfirming(p.id)} aria-label={`Delete ${p.name}`}><Icon name="trash-2" /></button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="a-section">
        <div className="a-head">
          <div>
            <h2>Recent requests</h2>
            <p className="muted">The newest 30. Every request is also a row in the Requests tab of your sheet.</p>
          </div>
          {initial.sheetUrl && (
            <a className="btn ghost sm" href={initial.sheetUrl} target="_blank" rel="noopener noreferrer"><Icon name="external-link" />Open all requests</a>
          )}
        </div>
        {initial.requests.length === 0 ? (
          <div className="a-empty"><Icon name="inbox" size={28} /><p>No requests yet. They'll appear here as soon as someone books.</p></div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr><th>Received</th><th>Type</th><th>Practitioner</th><th>Name</th><th>Phone</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {initial.requests.map((r, i) => (
                  <tr key={r.requestId || i}>
                    <td className="nowrap">{r.received}</td>
                    <td>{r.type}</td>
                    <td>{r.practitioner || "—"}</td>
                    <td>
                      {r.name}
                      {(r.message || r.concerns) && (
                        <details className="a-msg"><summary>Details</summary>
                          {r.concerns && <p><strong>Wants help with:</strong> {r.concerns}</p>}
                          {r.language && <p><strong>Language:</strong> {r.language}</p>}
                          {r.budget && <p><strong>Budget:</strong> {r.budget}</p>}
                          {r.email && <p><strong>Email:</strong> {r.email}</p>}
                          {r.message && <p>{r.message}</p>}
                        </details>
                      )}
                    </td>
                    <td className="nowrap">{r.phone}</td>
                    <td>{r.time}</td>
                    <td><span className="a-pill on">{r.status || "New"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
