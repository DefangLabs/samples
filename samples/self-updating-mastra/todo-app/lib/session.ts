import { headers } from "next/headers";
import { auth, ensureAuthReady, type AppSession } from "@/lib/auth";

export async function getSession(): Promise<AppSession | null> {
  await ensureAuthReady();
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function isAdmin(
  session: AppSession | null,
): session is AppSession & { user: AppSession["user"] & { role: "admin" } } {
  return session?.user.role === "admin";
}

export function isAdminUiEnabled(): boolean {
  return process.env.ADMIN_UI === "true";
}
