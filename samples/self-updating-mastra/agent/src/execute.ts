import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createCoder, TARGET_DIR } from "./coder.js";
import { appendLog, finishRun, type Run } from "./runs.js";

const exec = promisify(execFile);

export async function executeRun(run: Run): Promise<void> {
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
        await finishRun(run, "failed");
        return;
      }
    }
    appendLog(run, "Typecheck passed. Changes are live.");
    await finishRun(run, "done");
  } catch (err) {
    appendLog(run, `Run failed: ${err instanceof Error ? err.message : String(err)}`);
    await finishRun(run, "failed");
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
