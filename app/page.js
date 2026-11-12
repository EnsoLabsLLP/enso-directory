import Script from "next/script";
import Icon from "@/components/Icon";
import icons from "@/lib/icons.json";
import { listPractitioners } from "@/lib/store";
import { toPublic, sortRecords } from "@/lib/practitioners";
import { PUBLIC_CATALOG } from "@/lib/catalog";

// Rebuilt at most once a minute, and straight away when you save in the admin panel.
export const revalidate = 60;

async function loadPeople() {
  try {
    return sortRecords(await listPractitioners())
      .filter((p) => p.status !== "Hidden")
      .map(toPublic);
  } catch (e) {
    console.error("Could not load practitioners", e);
    return [];
  }
}

export default async function DirectoryPage() {
  const people = await loadPeople();
  const data = JSON.stringify({ people, catalog: PUBLIC_CATALOG, icons }).replace(/</g, "\\u003c");

  return (
    <>
      <header className="top" id="top">
        <div className="wrap bar">
          <img className="logo" src="/enso-logo.png" alt="Enso Labs" width="237" height="269" />
          <nav className="topnav" aria-label="Site">
            <a className="btn ghost sm" href="#help-me-choose">
              <Icon name="sparkles" />
              Help me choose
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero wrap">
          <p className="pill">
            <Icon name="video" />
            Online sessions, anywhere in India
          </p>
          <h1>Find the right therapist for you.</h1>
          <p className="lede">
            Browse Enso's first cohort of psychologists. Filter by what you're going through, your language and when
            you're free, then send a request. We'll confirm the time with you.
          </p>
          <form className="search" id="searchForm" role="search">
            <Icon name="search" />
            <label className="sr" htmlFor="q">Search practitioners</label>
            <input id="q" type="search" placeholder="Search by name, concern or approach" autoComplete="off" />
            <button className="btn" type="submit">Search</button>
          </form>
          <ul className="trust">
            <li>
              <span className="ibox"><Icon name="badge-check" /></span>
              <span><strong>Verified psychologists</strong><span className="t">Masters and MPhil qualified</span></span>
            </li>
            <li>
              <span className="ibox"><Icon name="video" /></span>
              <span><strong>Fully online</strong><span className="t">Join from anywhere in India</span></span>
            </li>
          </ul>
        </section>

        <section className="concerns wrap" aria-labelledby="cTitle">
          <div className="sec-head">
            <h2 id="cTitle">What would you like help with?</h2>
            <p>Pick one or more. The list below updates as you go.</p>
          </div>
          <div className="tiles" id="tiles" />
        </section>

        <section className="dir wrap" id="results" aria-label="Practitioners">
          <div className="side">
            <details className="filters" id="filters">
              <summary>
                <Icon name="sliders-horizontal" />
                Filters <span className="fcount" id="fcount" hidden />
                <Icon name="chevron-down" className="chev" />
              </summary>
              <div className="fbody" id="fbody" />
            </details>
            <div className="help help-side" id="helpSide" />
          </div>
          <div className="results">
            <div className="rhead">
              <div className="active-wrap">
                <p className="matchcount" id="count" aria-live="polite" />
                <div className="active" id="active" />
              </div>
              <div className="sort">
                <label htmlFor="fSort">Sort by</label>
                <div className="select-wrap">
                  <select id="fSort" defaultValue="featured">
                    <option value="featured">Featured</option>
                    <option value="feeAsc">Fee: low to high</option>
                    <option value="feeDesc">Fee: high to low</option>
                    <option value="exp">Most experience</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="list" id="list">
              {people.length === 0 && <p className="empty-note">Practitioner listings are being updated. Please check back shortly.</p>}
            </div>
            <div className="empty" id="empty" hidden>
              <p>No one matches all of these filters yet.</p>
              <button className="textbtn" type="button" data-clear="">Clear all filters</button>
            </div>
          </div>
        </section>

        <section className="how wrap" aria-labelledby="hTitle">
          <div className="sec-head"><h2 id="hTitle">How booking works</h2></div>
          <ol className="howlist">
            <li>
              <span className="ibox"><Icon name="search" /></span>
              <span className="n">Step 1</span>
              <h3>Find your fit</h3>
              <p>Use the filters or browse profiles to find someone who works with what you're going through.</p>
            </li>
            <li>
              <span className="ibox"><Icon name="message-circle-heart" /></span>
              <span className="n">Step 2</span>
              <h3>Send a request</h3>
              <p>Pick a time that suits you and leave a number we can reach you on.</p>
            </li>
            <li>
              <span className="ibox"><Icon name="calendar-check" /></span>
              <span className="n">Step 3</span>
              <h3>Get confirmed</h3>
              <p>The Enso team contacts you to confirm your session time and shares the joining details.</p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="foot" id="foot">
        <div className="wrap">
          <p className="crisis">
            <span className="ibox"><Icon name="phone" /></span>
            <span>
              Enso is not an emergency service. If you or someone you know is in immediate danger, call <strong>112</strong>.
              For free mental health support at any hour, call Tele-MANAS on <strong>14416</strong>.
            </span>
          </p>
          <p className="fine">© {new Date().getFullYear()} Enso Labs</p>
        </div>
      </footer>

      <div className="scrim" id="scrim" />
      <aside className="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="dTitle" aria-hidden="true" />

      <script id="enso-data" type="application/json" dangerouslySetInnerHTML={{ __html: data }} />
      <Script src="/directory.js" strategy="afterInteractive" />
    </>
  );
}
