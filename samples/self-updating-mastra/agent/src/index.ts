import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createCoder, TARGET_DIR } from "./coder.js";
import { appendLog, createRun, finishRun, getRun, type Run } from "./runs.js";

const exec = promisify(execFile);
const PORT = Number(process.env.AGENT_PORT ?? 4111);

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.post("/runs", async (c) => {
  const body = await c.req.json<{ request?: string }>().catch(() => null);
  const request = body?.request?.trim();
  if (!request) {
    return c.json({ error: "Body must be JSON with a non-empty `request` string." }, 400);
  }
  const run = createRun(request);
  // Fire and forget: the run continues even if the caller goes away. That is
  // the point of this server being separate from the app the agent edits.
  void executeRun(run);
  return c.json({ runId: run.id }, 202);
});

app.get("/runs/:id", (c) => {
  const run = getRun(c.req.param("id"));
  if (!run) return c.json({ error: "No such run." }, 404);
  return c.json({
    id: run.id,
    status: run.status,
    log: run.log.join("\n"),
    startedAt: run.startedAt,
    finishedAt: run.finishedAt ?? null,
  });
});

async function executeRun(run: Run): Promise<void> {
  try {
    appendLog(run, `Change request:\n${run.request}\n`);
    const summary = await promptAgent(run, run.request);
    if (summary) appendLog(run, `\nAgent: ${summary}`);

    appendLog(run, "\nVerifying the app still typechecks…");
    let check = await typecheck();
    if (!check.ok) {
      appendLog(run, `Typecheck failed:\n${check.output}`);
      appendLog(run, "\nAsking the agent to repair…");
      const repair = await promptAgent(
        run,
        `Your last edits broke the TypeScript build. Fix ONLY these errors, with minimal changes:\n\n${check.output}`,
      );
      if (repair) appendLog(run, `\nAgent: ${repair}`);
      check = await typecheck();
      if (!check.ok) {
        appendLog(run, `Typecheck still failing:\n${check.output}`);
        finishRun(run, "failed");
        return;
      }
    }
    appendLog(run, "Typecheck passed. Changes are live.");
    finishRun(run, "done");
  } catch (err) {
    appendLog(run, `Run failed: ${err instanceof Error ? err.message : String(err)}`);
    finishRun(run, "failed");
  }
}

/** Stream one agent turn, mirroring tool activity into the run log. */
async function promptAgent(run: Run, prompt: string): Promise<string> {
  const coder = createCoder();
  const stream = await coder.stream(prompt, { maxSteps: 50 });

  let text = "";
  let streamError: unknown;
  for await (const chunk of stream.fullStream) {
    switch (chunk.type) {
      case "text-delta": {
        text += chunk.payload.text;
        break;
      }
      case "tool-call": {
        const args = chunk.payload.args as Record<string, unknown> | undefined;
        const target = typeof args?.path === "string" ? ` ${args.path}` : "";
        appendLog(run, `→ ${chunk.payload.toolName}${target}`);
        break;
      }
      case "error": {
        appendLog(run, `⚠ model error: ${JSON.stringify(chunk.payload)}`);
        streamError = chunk.payload;
        break;
      }
      default:
        break;
    }
  }
  // A model/stream error means the turn did not actually apply any edits.
  // Surface it so the run is marked failed instead of falsely proceeding to
  // typecheck and reporting "Changes are live".
  if (streamError !== undefined) {
    throw new Error("the coding model call failed; see the model error above");
  }
  return text.trim();
}

async function typecheck(): Promise<{ ok: boolean; output: string }> {
  try {
    await exec("npx", ["tsc", "--noEmit"], {
      cwd: TARGET_DIR,
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: true, output: "" };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, output: (e.stdout || e.stderr || e.message || "unknown error").slice(0, 8000) };
  }
}

serve({ fetch: app.fetch, port: PORT, hostname: "127.0.0.1" }, (info) => {
  console.log(`Coding agent server listening on 127.0.0.1:${info.port}, editing ${TARGET_DIR}`);
});
