import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";

// A run applies its edits one file at a time, and the dev server hot-reloads
// after each write — so mid-run the app briefly imports a symbol that doesn't
// exist yet, renders half a refactor, etc. Those transient states throw errors
// that are noise, not bugs: the run is atomic at the git level (commit on
// success, revert on failure), so nothing partial is ever kept. Treat it as
// atomic here too by dropping auto-captured errors while a run is in flight;
// errors from the final, committed state are still recorded. The `agent_runs`
// table is written by the agent server and shares this database.
async function agentRunActive(): Promise<boolean> {
  try {
    const res = await query('SELECT 1 FROM "agent_runs" WHERE "status" = $1 LIMIT 1', ["running"]);
    return res.rows.length > 0;
  } catch {
    // No agent_runs table yet (agent not booted → no run active) or a transient
    // DB issue: fail open so a real error is never silently dropped.
    return false;
  }
}

// Records an app error into the feedback backlog so the admin can send it to the
// coding agent to fix. Used by both server-side (instrumentation onRequestError)
// and client-side (/api/errors) capture. Deduplicates against identical, still
// unresolved error reports so a flapping error doesn't flood the backlog, and
// skips errors thrown while an agent run is mid-edit (see above).
export async function recordError(message: string, context?: string): Promise<void> {
  const body = (context ? `${message}\n\n${context}` : message).slice(0, 2000);
  try {
    if (await agentRunActive()) return;
    const existing = await query(
      'SELECT 1 FROM "feedback" WHERE "source" = $1 AND "status" = $2 AND "body" = $3 LIMIT 1',
      ["error", "new", body],
    );
    if (existing.rows.length) return;
    await query(
      'INSERT INTO "feedback" ("id", "user_id", "body", "status", "source") VALUES ($1, NULL, $2, $3, $4)',
      [randomUUID(), body, "new", "error"],
    );
  } catch (err) {
    console.error("Could not record error to backlog.", err);
  }
}
