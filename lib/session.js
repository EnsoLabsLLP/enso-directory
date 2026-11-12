// Admin session cookie, signed with SESSION_SECRET. Works in middleware and route handlers.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "enso_admin";
export const SESSION_DAYS = 7;

function secret() {
  let s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV !== "production") s = "local-development-secret-not-for-production";
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

export async function createSession(email) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is missing or shorter than 32 characters");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

export async function verifySession(token) {
  const key = secret();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

function readCookie(header, name) {
  const hit = String(header || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

// For route handlers: returns the session or null.
export async function adminFromRequest(request) {
  return verifySession(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
}
