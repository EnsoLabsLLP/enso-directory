import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "./session";

// Server-side check for admin pages, in addition to the middleware.
export async function requireAdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) redirect("/admin/login");
  return session;
}
