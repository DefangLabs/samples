import { getAdminSession, getAgentUrl } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const runId = new URL(request.url).searchParams.get("runId")?.trim();
  if (!runId) {
    return Response.json({ error: "runId is required." }, { status: 400 });
  }

  const agentResponse = await fetch(getAgentUrl() + "/runs/" + encodeURIComponent(runId), {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!agentResponse) {
    return Response.json({ error: "The coding agent is unavailable." }, { status: 502 });
  }

  const result = await agentResponse.json().catch(() => ({
    error: "The coding agent returned an invalid response.",
  }));
  return Response.json(result, { status: agentResponse.status });
}
