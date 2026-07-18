import { randomUUID } from "node:crypto";
import { pool } from "./db.js";
import { headSha } from "./git.js";

/**
 * Publish (deployment) records. Statuses:
 *   awaiting_login → ready → deploying → cd_launched → live
 * plus terminal failure modes: failed, cancelled, unknown.
 *
 * "cd_launched" means `defang compose up --detach` handed off to the CD task
 * in the cloud; the dev container is usually REPLACED after that, so the row
 * is closed out by the NEXT container generation: on boot, if our git HEAD is
 * the publish commit a row points at, that deployment is self-evidently live.
 */
export type DeploymentStatus =
  | "awaiting_login"
  | "ready"
  | "deploying"
  | "cd_launched"
  | "live"
  | "failed"
  | "cancelled"
  | "unknown";

const TERMINAL: DeploymentStatus[] = ["live", "failed", "cancelled", "unknown"];

export async function ensureDeploymentSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "deployments" (
      "id" text PRIMARY KEY,
      "status" text NOT NULL,
      "triggered_by" text NOT NULL,
      "commit_sha" text,
      "log" text NOT NULL DEFAULT '',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "finished_at" timestamptz
    )
  `);
}

export async function createDeployment(triggeredBy: string): Promise<string> {
  const id = randomUUID();
  await pool.query(
    'INSERT INTO "deployments" ("id","status","triggered_by") VALUES ($1,$2,$3)',
    [id, "awaiting_login", triggeredBy],
  );
  return id;
}

export async function setDeploymentStatus(id: string, status: DeploymentStatus): Promise<void> {
  await pool.query(
    `UPDATE "deployments" SET "status"=$2, "finished_at"=CASE WHEN $3 THEN now() ELSE "finished_at" END WHERE "id"=$1`,
    [id, status, TERMINAL.includes(status)],
  );
}

export async function setDeploymentCommit(id: string, sha: string): Promise<void> {
  await pool.query('UPDATE "deployments" SET "commit_sha"=$2 WHERE "id"=$1', [id, sha]);
}

export async function appendDeploymentLog(id: string, chunk: string): Promise<void> {
  await pool
    .query('UPDATE "deployments" SET "log"="log" || $2 WHERE "id"=$1', [id, chunk])
    .catch((err) => console.error("append deployment log failed", err));
}

/**
 * List item: deliberately WITHOUT the log body. The publish panel polls the
 * list every couple of seconds, and a real CD launch log can be large — the
 * full log is fetched on demand per deployment via getDeployment instead.
 */
export interface DeploymentSummary {
  id: string;
  status: string;
  triggeredBy: string;
  commitSha: string | null;
  logChars: number;
  createdAt: string;
  finishedAt: string | null;
}

export interface DeploymentView extends DeploymentSummary {
  log: string;
}

interface DeploymentSummaryRow {
  id: string;
  status: string;
  triggered_by: string;
  commit_sha: string | null;
  log_chars: string; // pg returns bigint length() as a string
  created_at: Date;
  finished_at: Date | null;
}

interface DeploymentRow extends DeploymentSummaryRow {
  log: string;
}

function summaryFromRow(row: DeploymentSummaryRow): DeploymentSummary {
  return {
    id: row.id,
    status: row.status,
    triggeredBy: row.triggered_by,
    commitSha: row.commit_sha,
    logChars: Number(row.log_chars) || 0,
    createdAt: new Date(row.created_at).toISOString(),
    finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
  };
}

export async function listDeployments(limit = 10): Promise<DeploymentSummary[]> {
  const res = await pool.query<DeploymentSummaryRow>(
    'SELECT "id","status","triggered_by","commit_sha",length("log") AS "log_chars","created_at","finished_at" FROM "deployments" ORDER BY "created_at" DESC LIMIT $1',
    [limit],
  );
  return res.rows.map(summaryFromRow);
}

/** Full record including the persisted log, for the on-demand log viewer. */
export async function getDeployment(id: string): Promise<DeploymentView | null> {
  const res = await pool.query<DeploymentRow>(
    'SELECT "id","status","triggered_by","commit_sha","log",length("log") AS "log_chars","created_at","finished_at" FROM "deployments" WHERE "id"=$1',
    [id],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { ...summaryFromRow(row), log: row.log };
}

/**
 * Close out rows the previous container generation left open. Runs at boot:
 * - A row whose publish commit IS our HEAD: that deploy produced this very
 *   container — mark it live.
 * - Any other non-terminal row: the process that owned it is gone — mark it
 *   unknown (the admin can see the log and re-publish).
 */
export async function reconcileDeployments(): Promise<void> {
  const head = await headSha();
  const res = await pool.query<{ id: string; status: string; commit_sha: string | null }>(
    `SELECT "id","status","commit_sha"
     FROM "deployments" WHERE "status" NOT IN ('live','failed','cancelled','unknown')`,
  );
  for (const row of res.rows) {
    const status: DeploymentStatus = head && row.commit_sha === head ? "live" : "unknown";
    await setDeploymentStatus(row.id, status);
    console.log(`reconciled deployment ${row.id.slice(0, 8)}: ${row.status} -> ${status}`);
  }
}
