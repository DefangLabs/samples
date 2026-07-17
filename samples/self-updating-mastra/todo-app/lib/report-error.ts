import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";

// Records an app error into the feedback backlog so the admin can send it to the
// coding agent to fix. Used by both server-side (instrumentation onRequestError)
// and client-side (/api/errors) capture. Deduplicates against identical, still
// unresolved error reports so a flapping error doesn't flood the backlog.
export async function recordError(message: string, context?: string): Promise<void> {
  const body = (context ? `${message}\n\n${context}` : message).slice(0, 2000);
  try {
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
