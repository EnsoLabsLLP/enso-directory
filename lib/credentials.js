import { createHash, timingSafeEqual } from "crypto";

const DEV_EMAIL = "admin@enso.local";
const DEV_PASSWORD = "enso-admin";

export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) || process.env.NODE_ENV !== "production";
}

const digest = (s) => createHash("sha256").update(String(s)).digest();

export function checkCredentials(email, password) {
  let wantEmail = process.env.ADMIN_EMAIL;
  let wantPassword = process.env.ADMIN_PASSWORD;
  if ((!wantEmail || !wantPassword) && process.env.NODE_ENV !== "production") {
    wantEmail = DEV_EMAIL;
    wantPassword = DEV_PASSWORD;
  }
  if (!wantEmail || !wantPassword) return false;
  const emailOk = timingSafeEqual(digest(String(email).trim().toLowerCase()), digest(wantEmail.trim().toLowerCase()));
  const passOk = timingSafeEqual(digest(password), digest(wantPassword));
  return emailOk && passOk;
}
