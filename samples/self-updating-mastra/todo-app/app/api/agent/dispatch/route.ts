import { getAdminSession, getAgentUrl } from "@/lib/admin";
import { query } from "@/lib/db";

interface FeedbackRow {
  id: string;
  body: string;
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as {
    feedbackIds?: unknown;
    instructions?: unknown;
  } | null;

  const feedbackIds = Array.isArray(payload?.feedbackIds)
    ? Array.from(
        new Set(
          payload.feedbackIds
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ).slice(0, 100)
    : [];
  const instructions =
    typeof payload?.instructions === "string" ? payload.instructions.trim().slice(0, 5000) : "";

  if (!feedbackIds.length && !instructions) {
    return Response.json(
      { error: "Select feedback or add instructions for the coding agent." },
      { status: 400 },
    );
  }

  const feedback = feedbackIds.length
    ? await query<FeedbackRow>(
        'SELECT "id", "body" FROM "feedback" WHERE "id" = ANY($1::text[]) ORDER BY "created_at"',
        [feedbackIds],
      )
    : { rows: [] as FeedbackRow[] };

  const feedbackSection = feedback.rows.length
    ? feedback.rows.map((item, index) => String(index + 1) + ". " + item.body).join("\n")
    : "(No user feedback selected.)";
  const instructionSection = instructions || "(No additional instructions.)";
  const changeRequest = [
    "Update the todo application based on this curated change request.",
    "",
    "User feedback:",
    feedbackSection,
    "",
    "Administrator instructions:",
    instructionSection,
    "",
    "Keep the implementation focused, preserve authentication and per-user data isolation, and make sure TypeScript still compiles.",
  ].join("\n");

  const agentResponse = await fetch(getAgentUrl() + "/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: changeRequest }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!agentResponse) {
    return Response.json({ error: "The coding agent is unavailable." }, { status: 502 });
  }

  const agentResult = (await agentResponse.json().catch(() => null)) as {
    runId?: unknown;
    error?: unknown;
  } | null;

  if (!agentResponse.ok || typeof agentResult?.runId !== "string") {
    return Response.json(
      {
        error:
          typeof agentResult?.error === "string"
            ? agentResult.error
            : "The coding agent rejected the change request.",
      },
      { status: 502 },
    );
  }

  if (feedback.rows.length) {
    await query('UPDATE "feedback" SET "status" = $1 WHERE "id" = ANY($2::text[])', [
      "sent",
      feedback.rows.map((item) => item.id),
    ]);
  }

  return Response.json({ runId: agentResult.runId });
}
