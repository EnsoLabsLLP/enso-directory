// "Start today" app section and the site footer, matching ensoai.in.
// Optional images: drop these into /public and they appear automatically on the next deploy.
//   public/app-store-badge.svg   Apple's official "Download on the App Store" badge
//   public/enso-app-phones.png   the phone screenshots shown on the right of "Start today"
import fs from "fs";
import path from "path";
import Icon from "./Icon";
import { SITE } from "@/lib/site";

const hasPublic = (name) => {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", name));
  } catch {
    return false;
  }
};

function AppStoreLink({ className = "" }) {
  const href = SITE.appStoreUrl || SITE.mainSite;
  if (hasPublic("app-store-badge.svg")) {
    return (
      <a className={`store-badge ${className}`} href={href} target="_blank" rel="noopener noreferrer">
        <img src="/app-store-badge.svg" alt="Download on the App Store" width="156" height="52" />
      </a>
    );
  }
  return (
    <a className={`store-btn ${className}`} href={href} target="_blank" rel="noopener noreferrer">
      <Icon name="smartphone" />
      Download the app
    </a>
  );
}

const ext = (href) => (/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});

export default function SiteEnd() {
  const phones = hasPublic("enso-app-phones.png");
  const ensoLinks = [
    { label: "Download", href: SITE.appStoreUrl || SITE.mainSite },
    { label: "Sign in", href: SITE.signInUrl },
    { label: "Privacy", href: SITE.privacyUrl },
    { label: "Terms", href: SITE.termsUrl }
  ].filter((l) => l.href);

  return (
    <div className="site-end" id="foot">
      <section className="wrap" aria-labelledby="startTitle">
        <div className={`start-card${phones ? " has-phones" : ""}`}>
          <div className="start-copy">
            <h2 id="startTitle">Start today</h2>
            <p>Download the journaling app and make progress on your own. Book therapy when you want extra help.</p>
            <AppStoreLink />
          </div>
          {phones && (
            <div className="start-art" aria-hidden="true">
              <img src="/enso-app-phones.png" alt="" loading="lazy" />
            </div>
          )}
        </div>
      </section>

      <footer className="wrap">
        <div className="footer-card">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/enso-logo.png" alt="Enso Labs" width="237" height="269" className="footer-logo" />
              <p>A private place to write what you feel, see what repeats, and talk it through when you want.</p>
              {(SITE.linkedinUrl || SITE.email) && (
                <div className="footer-social">
                  {SITE.linkedinUrl && (
                    <a href={SITE.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="Enso Labs on LinkedIn"><Icon name="linkedin" /></a>
                  )}
                  {SITE.email && (
                    <a href={`mailto:${SITE.email}`} aria-label={`Email ${SITE.email}`}><Icon name="mail" /></a>
                  )}
                </div>
              )}
            </div>
            <nav className="footer-cols" aria-label="Footer">
              <div>
                <h3>Product</h3>
                <ul>{SITE.product.map((l) => <li key={l.label}><a href={l.href} {...ext(l.href)}>{l.label}</a></li>)}</ul>
              </div>
              <div>
                <h3>Enso</h3>
                <ul>{ensoLinks.map((l) => <li key={l.label}><a href={l.href} {...ext(l.href)}>{l.label}</a></li>)}</ul>
              </div>
              <div className="footer-app">
                <h3>The journaling app</h3>
                <AppStoreLink className="small" />
              </div>
            </nav>
          </div>

          <p className="crisis">
            <span className="ibox"><Icon name="phone" /></span>
            <span>
              Enso is not an emergency service. If you or someone you know is in immediate danger, call <strong>112</strong>.
              For free mental health support at any hour, call Tele-MANAS on <strong>14416</strong>.
            </span>
          </p>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Enso Labs</p>
          </div>
          <div className="footer-mark" aria-hidden="true">Enso Labs</div>
        </div>
      </footer>
    </div>
  );
}
