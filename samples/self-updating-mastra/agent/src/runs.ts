import { randomUUID } from "node:crypto";
import { pool } from "./db.js";

export type RunStatus = "running" | "done" | "failed";

export interface Run {
  id: string;
  status: RunStatus;
  request: string;
  log: string[];
  model: string;
  verdict: string | null;
  startedAt: string;
  finishedAt?: string;
}

// Active runs are kept in memory for fast log appends and live polling; every
// run is also mirrored to Postgres so history and logs survive restarts.
const active = new Map<string, Run>();

export async function createRun(request: string, model: string): Promise<Run> {
  const run: Run = {
    id: randomUUID(),
    status: "running",
    request,
    log: [],
    model,
    verdict: null,
    startedAt: new Date().toISOString(),
  };
  active.set(run.id, run);
  await pool
    .query(
      'INSERT INTO "agent_runs" ("id","request","status","log","model") VALUES ($1,$2,$3,$4,$5)',
      [run.id, request, run.status, "", model],
    )
    .catch((err) => console.error("persist run (create) failed", err));
  return run;
}

export function appendLog(run: Run, line: string): void {
  run.log.push(line);
  console.log(`[run ${run.id.slice(0, 8)}] ${line}`);
}

export async function finishRun(run: Run, status: Exclude<RunStatus, "running">): Promise<void> {
  run.status = status;
  run.finishedAt = new Date().toISOString();
  await persist(run);
}

export async function setVerdict(run: Run, verdict: string): Promise<void> {
  run.verdict = verdict;
  await persist(run);
}

async function persist(run: Run): Promise<void> {
  await pool
    .query(
      'UPDATE "agent_runs" SET "status"=$2,"log"=$3,"verdict"=$4,"finished_at"=$5 WHERE "id"=$1',
      [run.id, run.status, run.log.join("\n"), run.verdict, run.finishedAt ?? null],
    )
    .catch((err) => console.error("persist run (update) failed", err));
}

export interface RunView {
  id: string;
  status: string;
  log: string;
  model: string | null;
  verdict: string | null;
  createdAt: string;
  finishedAt: string | null;
}

function toView(run: Run): RunView {
  return {
    id: run.id,
    status: run.status,
    log: run.log.join("\n"),
    model: run.model,
    verdict: run.verdict,
    createdAt: run.startedAt,
    finishedAt: run.finishedAt ?? null,
  };
}

interface RunRow {
  id: string;
  status: string;
  log: string;
  model: string | null;
  verdict: string | null;
  created_at: Date;
  finished_at: Date | null;
}

function rowToView(row: RunRow): RunView {
  return {
    id: row.id,
    status: row.status,
    log: row.log,
    model: row.model,
    verdict: row.verdict,
    createdAt: new Date(row.created_at).toISOString(),
    finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
  };
}

/** Live view for polling: prefer the in-memory active run, fall back to DB. */
export async function getRunView(id: string): Promise<RunView | null> {
  const live = active.get(id);
  if (live) return toView(live);
  const res = await pool.query<RunRow>(
    'SELECT "id","status","log","model","verdict","created_at","finished_at" FROM "agent_runs" WHERE "id"=$1',
    [id],
  );
  return res.rows[0] ? rowToView(res.rows[0]) : null;
}

export async function listRecentRuns(limit = 15): Promise<RunView[]> {
  const res = await pool.query<RunRow>(
    'SELECT "id","status","log","model","verdict","created_at","finished_at" FROM "agent_runs" ORDER BY "created_at" DESC LIMIT $1',
    [limit],
  );
  return res.rows.map(rowToView);
}
