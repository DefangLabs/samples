import { randomUUID } from "node:crypto";

export type RunStatus = "running" | "done" | "failed";

export interface Run {
  id: string;
  status: RunStatus;
  request: string;
  log: string[];
  startedAt: string;
  finishedAt?: string;
}

// Runs are kept in memory: the dev service is pinned to a single instance,
// and a run's value is watching it happen live. History does not need to
// survive a restart.
const runs = new Map<string, Run>();

export function createRun(request: string): Run {
  const run: Run = {
    id: randomUUID(),
    status: "running",
    request,
    log: [],
    startedAt: new Date().toISOString(),
  };
  runs.set(run.id, run);
  return run;
}

export function getRun(id: string): Run | undefined {
  return runs.get(id);
}

export function appendLog(run: Run, line: string): void {
  run.log.push(line);
  console.log(`[run ${run.id.slice(0, 8)}] ${line}`);
}

export function finishRun(run: Run, status: Exclude<RunStatus, "running">): void {
  run.status = status;
  run.finishedAt = new Date().toISOString();
}
