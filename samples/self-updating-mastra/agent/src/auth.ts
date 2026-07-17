import type { Context } from "hono";
import { pool } from "./db.js";

export interface AdminIdentity {
  email: string;
  via: "session" | "break-glass";
}

function readCookie(header: string | undefined, matches: (name: string) => boolean): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (matches(name)) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/**
 * Resolve an admin identity for the request, independently of the Next.js app —
 * which may be crash-looping, since that is the whole reason this console lives
 * in the agent server. Two gates:
 *   1. Break-glass ADMIN_TOKEN (env), presented via the `mastra_admin` cookie.
 *      Always works, even if the session/user tables are unusable.
 *   2. The normal better-auth admin login: the session cookie is validated
 *      directly against Postgres. The cookie value is `<token>.<hmac>`; we match
 *      the token against a live, unexpired session for a user whose role is
 *      admin. The HMAC is not re-verified here — for this recovery console, a
 *      matching high-entropy session row is a sufficient gate.
 */
export async function getAdminIdentity(c: Context): Promise<AdminIdentity | null> {
  const cookieHeader = c.req.header("cookie");

  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    const provided = readCookie(cookieHeader, (n) => n === "mastra_admin");
    if (provided && provided === adminToken) return { email: "break-glass", via: "break-glass" };
  }

  const sessionCookie = readCookie(cookieHeader, (n) => n.endsWith("better-auth.session_token"));
  const token = sessionCookie?.split(".")[0];
  if (token) {
    const res = await pool.query<{ email: string; role: string; expiresAt: Date }>(
      'SELECT u."email", u."role", s."expiresAt" FROM "session" s JOIN "user" u ON u."id" = s."userId" WHERE s."token" = $1',
      [token],
    );
    const row = res.rows[0];
    if (row && row.role === "admin" && new Date(row.expiresAt).getTime() > Date.now()) {
      return { email: row.email, via: "session" };
    }
  }

  return null;
}

export function adminTokenConfigured(): boolean {
  return Boolean(process.env.ADMIN_TOKEN);
}
