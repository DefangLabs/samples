import { getSession, isAdmin, isAdminUiEnabled } from "@/lib/session";

export async function getAdminSession() {
  if (!isAdminUiEnabled()) return null;
  const session = await getSession();
  return isAdmin(session) ? session : null;
}

export function getAgentUrl(): string {
  return (process.env.AGENT_URL ?? "http://localhost:4111").replace(/\/$/, "");
}
