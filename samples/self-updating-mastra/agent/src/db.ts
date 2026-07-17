import { Pool } from "pg";

// The admin console is hosted in this server — deliberately outside the Next.js
// app that the coding agent edits — so it reads and writes Postgres directly
// instead of going through the app (which may be crashing). sslmode in
// DATABASE_URL is the single source of TLS truth (no-verify for managed PG);
// pg derives ssl from it.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Runs are persisted here (not in the Next.js app's schema) so run history and
// logs survive Next.js crashes and app redeploys. Idempotent; safe to re-run.
export async function ensureAgentSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "agent_runs" (
      "id" text PRIMARY KEY,
      "request" text NOT NULL,
      "status" text NOT NULL,
      "log" text NOT NULL DEFAULT '',
      "model" text,
      "verdict" text,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "finished_at" timestamptz
    )
  `);
  await pool.query(
    'CREATE INDEX IF NOT EXISTS "agent_runs_created_idx" ON "agent_runs" ("created_at" DESC)',
  );
  await pool.query('ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "commit_sha" text');
}
