import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Agent } from "@mastra/core/agent";
import type { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { adminTokenConfigured, getAdminIdentity } from "./auth.js";
import { pool } from "./db.js";
import { executeRun, getActiveRun } from "./execute.js";
import { history, isRevertable, REPO_DIR, revertCommit } from "./git.js";
import { getModel } from "./model.js";
import { createRun, getRunView, listRecentRuns, setVerdictById } from "./runs.js";

const exec = promisify(execFile);

interface FeedbackRow {
  id: string;
  body: string;
  status: string;
  email: string | null;
  source: string;
  created_at: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildChangeRequest(feedbackBodies: string[], instructions: string): string {
  const feedbackSection = feedbackBodies.length
    ? feedbackBodies.map((body, index) => `${index + 1}. ${body}`).join("\n")
    : "(No user feedback selected.)";
  const instructionSection = instructions || "(No additional instructions.)";
  return [
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
}

const PAGE_STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; }
  a { color: #7c3aed; }
  .bar { border-bottom: 1px solid #e2e8f0; background: #fff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  .bar .title { font-weight: 700; }
  .bar .who { color: #64748b; font-size: 14px; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 32px 24px; }
  .grid { display: grid; gap: 28px; grid-template-columns: minmax(0,1fr) minmax(320px,0.85fr); }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #7c3aed; }
  h1 { margin: 8px 0 0; font-size: 28px; }
  h3 { margin: 28px 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: .12em; color: #64748b; }
  .card { border: 1px solid #e2e8f0; background: #fff; border-radius: 16px; overflow: hidden; }
  .fb { padding: 16px 18px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
  .fb:first-child { border-top: 0; }
  .fb .meta { font-size: 12px; color: #94a3b8; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .fb .meta .email { color: #475569; font-weight: 600; }
  .fb .body { margin: 8px 0 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
  .pill { border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .pill.new { background: #fef3c7; color: #b45309; }
  .pill.sent { background: #d1fae5; color: #047857; }
  .pill.error { background: #ffe4e6; color: #be123c; }
  .pill.running { background: #ede9fe; color: #6d28d9; }
  .pill.done { background: #d1fae5; color: #047857; }
  .pill.failed { background: #ffe4e6; color: #be123c; }
  .empty { padding: 40px 24px; text-align: center; color: #94a3b8; }
  .panel { background: #0f172a; color: #fff; border-radius: 16px; padding: 24px; }
  .panel h2 { margin: 6px 0 0; }
  .panel p { color: #cbd5e1; font-size: 14px; line-height: 1.5; }
  textarea { width: 100%; margin-top: 16px; resize: vertical; min-height: 130px; border-radius: 12px; border: 1px solid #334155; background: #1e293b; color: #fff; padding: 14px; font: inherit; font-size: 14px; }
  button.send { margin-top: 14px; width: 100%; border: 0; border-radius: 12px; background: #8b5cf6; color: #fff; font-weight: 700; padding: 12px; cursor: pointer; }
  button.send:disabled { opacity: .6; cursor: default; }
  .err { margin-top: 12px; background: rgba(159,18,57,.4); color: #fecdd3; border-radius: 8px; padding: 8px 12px; font-size: 14px; }
  .run { margin-top: 24px; }
  .run .head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; gap: 8px; flex-wrap: wrap; }
  .run .meta { font-size: 12px; color: #64748b; }
  .run pre { margin: 0; max-height: 26rem; min-height: 8rem; overflow: auto; white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 18px; font: 12px/1.5 ui-monospace, monospace; }
  .runrow { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .runrow:first-child { border-top: 0; }
  .runrow:hover { background: #f8fafc; }
  .runrow .mono { font: 12px ui-monospace, monospace; color: #475569; }
  .runrow .model { font-size: 12px; color: #64748b; margin-left: auto; }
  .histrow { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px; }
  .histrow:first-child { border-top: 0; }
  .histrow .mono { font: 12px ui-monospace, monospace; color: #475569; flex-shrink: 0; }
  .histrow .subject { font-size: 13px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .histrow .subject.link { cursor: pointer; }
  .histrow .subject.link:hover { text-decoration: underline; }
  .pill.publish { background: #dbeafe; color: #1d4ed8; }
  .pill.agent { background: #ede9fe; color: #6d28d9; }
  .pill.admin { background: #fef3c7; color: #b45309; }
  button.mini { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #475569; font-size: 11px; font-weight: 600; padding: 4px 8px; cursor: pointer; flex-shrink: 0; }
  button.mini:hover { background: #f1f5f9; }
  button.mini:disabled { opacity: .5; cursor: default; }
  .gate { max-width: 460px; margin: 8vh auto; padding: 0 24px; }
  .gate input { width: 100%; margin-top: 10px; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font: inherit; }
  .gate button { margin-top: 12px; width: 100%; border: 0; border-radius: 10px; background: #0f172a; color: #fff; font-weight: 700; padding: 12px; cursor: pointer; }
`;

function renderGate(message?: string): string {
  const tokenForm = adminTokenConfigured()
    ? `<form method="post" action="/admin/login" style="margin-top:24px">
         <p class="eyebrow">Break-glass access</p>
         <p style="color:#475569;font-size:14px;margin:6px 0 0">Use the admin token if the main app is down and your session has expired.</p>
         <input type="password" name="token" placeholder="Admin token" autocomplete="off" required />
         <button type="submit">Enter console</button>
       </form>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin console</title><style>${PAGE_STYLE}</style></head>
    <body><div class="gate">
      <p class="eyebrow">Coding agent</p>
      <h1>Admin recovery console</h1>
      <p style="color:#475569;line-height:1.5;margin-top:8px">This console runs outside the app the agent edits, so it stays available even if the main app is broken.</p>
      ${message ? `<p class="err" style="color:#be123c;background:#ffe4e6">${escapeHtml(message)}</p>` : ""}
      <p style="margin-top:24px"><a href="/login">Sign in as admin →</a> (uses the app's normal login)</p>
      ${tokenForm}
    </div></body></html>`;
}

function renderShell(who: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin console</title><style>${PAGE_STYLE}</style></head>
  <body>
    <div class="bar"><span class="title">Admin console <span style="color:#64748b;font-weight:400">— coding agent</span></span><span class="who">${escapeHtml(who)}</span></div>
    <div class="wrap"><div class="grid">
      <section>
        <p class="eyebrow">Backlog</p>
        <h1>Choose what to improve</h1>
        <div class="card" id="feedback" style="margin-top:16px"><p class="empty">Loading…</p></div>
      </section>
      <aside>
        <div class="panel">
          <p class="eyebrow" style="color:#c4b5fd">Coding agent</p>
          <h2>Shape the request</h2>
          <p>Add context or a specific direction before the selected items reach Mastra.</p>
          <textarea id="instructions" maxlength="5000" placeholder="Instructions for the coding agent"></textarea>
          <button class="send" id="send" type="button">Send to coding agent</button>
          <div id="error"></div>
        </div>
        <div class="card run" id="run" style="display:none">
          <div class="head">
            <div><p class="eyebrow" style="color:#94a3b8">Run</p><p class="mono" id="run-id" style="font:12px ui-monospace,monospace;color:#475569;margin:4px 0 0"></p></div>
            <span class="pill running" id="run-status">connecting</span>
          </div>
          <div class="meta" id="run-meta" style="padding:8px 18px 0"></div>
          <div style="padding:8px 18px 0"><button class="mini" id="grade" type="button" style="display:none">Grade this run</button></div>
          <pre id="run-log">Reading agent output…</pre>
        </div>
        <h3>Recent runs</h3>
        <div class="card" id="runs"><p class="empty">Loading…</p></div>
        <h3>History</h3>
        <div class="card" id="history"><p class="empty">Loading…</p></div>
      </aside>
    </div></div>
    <script>${CONSOLE_SCRIPT}</script>
  </body></html>`;
}

const CONSOLE_SCRIPT = `
  const KEY = "self-updating-mastra-active-run";
  const selected = new Set();
  let pollTimer;
  const $ = (id) => document.getElementById(id);

  function fmtTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
  function showError(msg) { $("error").innerHTML = msg ? '<p class="err">' + msg + '</p>' : ""; }
  function refreshSendLabel() { $("send").textContent = "Send to coding agent" + (selected.size ? " (" + selected.size + ")" : ""); }

  function renderFeedback(items) {
    const box = $("feedback");
    box.innerHTML = "";
    if (!items.length) { box.innerHTML = '<p class="empty">Nothing in the backlog yet.</p>'; return; }
    for (const item of items) {
      const row = document.createElement("div"); row.className = "fb";
      const cb = document.createElement("input"); cb.type = "checkbox";
      cb.checked = selected.has(item.id); cb.disabled = item.status !== "new"; cb.style.marginTop = "4px";
      cb.addEventListener("change", () => { cb.checked ? selected.add(item.id) : selected.delete(item.id); refreshSendLabel(); });
      const main = document.createElement("div"); main.style.minWidth = "0"; main.style.flex = "1";
      const meta = document.createElement("div"); meta.className = "meta";
      const who = document.createElement("span"); who.className = "email";
      who.textContent = item.source === "error" ? "system" : (item.email || "unknown");
      const dot = document.createElement("span"); dot.textContent = "•";
      const time = document.createElement("time"); time.textContent = fmtTime(item.createdAt);
      const tag = document.createElement("span");
      tag.className = "pill " + (item.source === "error" ? "error" : item.status === "new" ? "new" : "sent");
      tag.textContent = item.source === "error" ? "error" : item.status;
      meta.append(who, dot, time, tag);
      const body = document.createElement("p"); body.className = "body"; body.textContent = item.body;
      main.append(meta, body); row.append(cb, main); box.append(row);
    }
    refreshSendLabel();
  }

  function renderRuns(runs) {
    const box = $("runs");
    box.innerHTML = "";
    if (!runs.length) { box.innerHTML = '<p class="empty">No runs yet.</p>'; return; }
    for (const r of runs) {
      const row = document.createElement("div"); row.className = "runrow"; row.title = "View this run's log";
      const status = document.createElement("span"); status.className = "pill " + r.status; status.textContent = r.status;
      const id = document.createElement("span"); id.className = "mono"; id.textContent = r.id.slice(0, 8);
      const model = document.createElement("span"); model.className = "model";
      model.textContent = (r.commitSha ? r.commitSha.slice(0, 8) + " · " : "") + (r.model || "");
      row.append(status, id, model);
      row.addEventListener("click", () => viewRun(r.id));
      box.append(row);
    }
  }

  function renderHistory(entries) {
    const box = $("history");
    box.innerHTML = "";
    if (!entries.length) { box.innerHTML = '<p class="empty">No history yet.</p>'; return; }
    for (const e of entries) {
      const row = document.createElement("div"); row.className = "histrow";
      const kind = e.deploymentId ? "publish" : e.runId ? "agent" : "admin";
      const badge = document.createElement("span"); badge.className = "pill " + kind; badge.textContent = kind;
      const sha = document.createElement("span"); sha.className = "mono"; sha.textContent = e.sha.slice(0, 8);
      const subject = document.createElement("span");
      subject.className = "subject" + (e.runId ? " link" : "");
      subject.textContent = e.subject;
      subject.title = e.author + " · " + fmtTime(e.date) + (e.feedbackIds.length ? " · feedback: " + e.feedbackIds.join(", ") : "");
      if (e.runId) subject.addEventListener("click", () => viewRun(e.runId));
      row.append(badge, sha, subject);
      if (e.revertable) {
        const btn = document.createElement("button"); btn.className = "mini"; btn.type = "button"; btn.textContent = "Revert";
        btn.addEventListener("click", () => revert(e.sha, btn));
        row.append(btn);
      }
      box.append(row);
    }
  }

  async function revert(sha, btn) {
    if (!confirm("Revert commit " + sha.slice(0, 8) + "? This creates a new commit restoring the previous state, and the live dev app updates immediately.")) return;
    btn.disabled = true;
    try {
      const res = await fetch("/admin/history/" + encodeURIComponent(sha) + "/revert", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.revertSha) { alert((data && data.error) || "Revert failed."); return; }
      if (!data.typecheckOk) alert("Reverted, but the app no longer typechecks — later changes may depend on this commit. Consider reverting the revert, or dispatch a repair run.\n\n" + (data.typecheckOutput || ""));
      loadData();
    } finally { btn.disabled = false; }
  }

  async function loadData() {
    try {
      const [dataRes, histRes] = await Promise.all([
        fetch("/admin/data", { cache: "no-store" }),
        fetch("/admin/history", { cache: "no-store" }),
      ]);
      if (dataRes.ok) {
        const data = await dataRes.json();
        renderFeedback(data.feedback || []);
        renderRuns(data.runs || []);
      }
      if (histRes.ok) {
        const hist = await histRes.json();
        renderHistory(hist.history || []);
      }
    } catch {}
  }

  function showRun(data) {
    $("run").style.display = "";
    $("run-id").textContent = data.id ? data.id.slice(0, 8) : "";
    $("run-status").textContent = data.status; $("run-status").className = "pill " + data.status;
    const bits = [];
    if (data.model) bits.push("model: " + data.model);
    if (data.commitSha) bits.push("commit: " + data.commitSha.slice(0, 8));
    if (data.verdict) bits.push("verdict: " + data.verdict);
    if (data.finishedAt) bits.push("finished: " + fmtTime(data.finishedAt));
    $("run-meta").textContent = bits.join("   ·   ");
    const gradeBtn = $("grade");
    gradeBtn.style.display = data.id && data.status !== "running" && !data.verdict ? "" : "none";
    gradeBtn.dataset.runId = data.id || "";
    $("run-log").textContent = data.log || "Reading agent output…";
  }

  async function grade() {
    const id = $("grade").dataset.runId;
    if (!id) return;
    $("grade").disabled = true; $("grade").textContent = "Grading…";
    try {
      const res = await fetch("/admin/runs/" + encodeURIComponent(id) + "/verdict", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.verdict) { alert((data && data.error) || "Grading failed."); return; }
      viewRun(id);
    } finally { $("grade").disabled = false; $("grade").textContent = "Grade this run"; }
  }

  async function viewRun(id) {
    try {
      const res = await fetch("/admin/runs/" + encodeURIComponent(id), { cache: "no-store" });
      const data = await res.json(); if (res.ok) showRun({ ...data, id });
    } catch {}
  }

  async function poll(id) {
    let res;
    try { res = await fetch("/admin/runs/" + encodeURIComponent(id), { cache: "no-store" }); }
    catch { pollTimer = setTimeout(() => poll(id), 4000); return; }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) { pollTimer = setTimeout(() => poll(id), 4000); return; }
    showRun({ ...data, id });
    if (data.status === "running") { pollTimer = setTimeout(() => poll(id), 2000); }
    else { localStorage.removeItem(KEY); selected.clear(); loadData(); }
  }

  async function dispatch() {
    $("send").disabled = true; showError("");
    let res;
    try {
      res = await fetch("/admin/dispatch", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedbackIds: Array.from(selected), instructions: $("instructions").value.trim() }),
      });
    } catch { $("send").disabled = false; showError("The coding agent is unavailable."); return; }
    const data = await res.json().catch(() => null);
    $("send").disabled = false;
    if (!res.ok || !data || !data.runId) { showError((data && data.error) || "Could not start the coding agent."); return; }
    $("instructions").value = "";
    localStorage.setItem(KEY, data.runId);
    showRun({ id: data.runId, status: "running", log: "Change request accepted. Waiting for the agent…" });
    poll(data.runId);
  }

  $("send").addEventListener("click", dispatch);
  $("grade").addEventListener("click", grade);
  loadData();
  const activeRun = localStorage.getItem(KEY);
  if (activeRun) poll(activeRun);
`;

export function registerAdminRoutes(app: Hono): void {
  // Break-glass login: exchange the admin token for a scoped cookie.
  app.post("/admin/login", async (c) => {
    const form = await c.req.parseBody();
    const token = typeof form.token === "string" ? form.token : "";
    if (adminTokenConfigured() && token && token === process.env.ADMIN_TOKEN) {
      setCookie(c, "mastra_admin", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/admin",
        maxAge: 60 * 60 * 24,
      });
      return c.redirect("/admin", 303);
    }
    return c.html(renderGate("That token was not accepted."), 401);
  });

  app.get("/admin", async (c) => {
    const identity = await getAdminIdentity(c);
    if (!identity) return c.html(renderGate(), 401);
    return c.html(renderShell(identity.email));
  });

  app.get("/admin/data", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    const feedback = await pool.query<FeedbackRow>(
      'SELECT f."id", f."body", f."status", f."created_at", f."source", u."email" FROM "feedback" f LEFT JOIN "user" u ON u."id" = f."user_id" ORDER BY f."created_at" DESC LIMIT 100',
    );
    const runs = await listRecentRuns();
    return c.json({
      feedback: feedback.rows.map((r) => ({
        id: r.id,
        body: r.body,
        status: r.status,
        source: r.source,
        email: r.email,
        createdAt: new Date(r.created_at).toISOString(),
      })),
      runs,
    });
  });

  app.post("/admin/dispatch", async (c) => {
    // Mirror the app's behavior: non-admins get a 404, not a hint the route exists.
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);

    const active = getActiveRun();
    if (active) {
      return c.json(
        { error: `A run is already in progress (${active.id.slice(0, 8)}). Wait for it to finish.` },
        409,
      );
    }

    const payload = (await c.req.json().catch(() => null)) as {
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
      return c.json({ error: "Select an item or add instructions for the coding agent." }, 400);
    }

    const feedback = feedbackIds.length
      ? await pool.query<{ id: string; body: string }>(
          'SELECT "id", "body" FROM "feedback" WHERE "id" = ANY($1::text[]) ORDER BY "created_at"',
          [feedbackIds],
        )
      : { rows: [] as { id: string; body: string }[] };

    const changeRequest = buildChangeRequest(
      feedback.rows.map((item) => item.body),
      instructions,
    );

    const run = await createRun(
      changeRequest,
      process.env.CHAT_MODEL ?? "unknown",
      feedback.rows.map((item) => item.id),
    );
    // Fire and forget: the run continues even if the admin closes the console.
    void executeRun(run);

    if (feedback.rows.length) {
      await pool.query('UPDATE "feedback" SET "status" = $1 WHERE "id" = ANY($2::text[])', [
        "sent",
        feedback.rows.map((item) => item.id),
      ]);
    }

    return c.json({ runId: run.id });
  });

  app.get("/admin/runs/:id", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    const view = await getRunView(c.req.param("id"));
    if (!view) return c.json({ error: "No such run." }, 404);
    return c.json(view);
  });

  // Git history of the live workspace: every successful run and (later) every
  // publish is a commit whose trailers point back at the Postgres rows it
  // addressed, so the console can cross-link both ways.
  app.get("/admin/history", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    const entries = await history(50);
    for (const entry of entries) {
      if (entry.runId) entry.revertable = await isRevertable(entry.sha);
    }
    return c.json({ history: entries });
  });

  // Admin-only revert of an agent commit (as a new commit, authored by the
  // admin). The dev server hot-reloads the restored files immediately.
  app.post("/admin/history/:sha/revert", async (c) => {
    const identity = await getAdminIdentity(c);
    if (!identity) return c.json({ error: "Not found." }, 404);
    if (getActiveRun()) return c.json({ error: "A run is in progress; wait for it to finish." }, 409);

    const sha = c.req.param("sha");
    if (!/^[0-9a-f]{7,40}$/i.test(sha)) return c.json({ error: "Invalid commit." }, 400);

    let revertSha: string;
    try {
      revertSha = await revertCommit(sha, identity.email);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
    }

    // Report whether the app still compiles after the revert; a revert can
    // break the build when later commits depend on the reverted one.
    let typecheckOk = true;
    let typecheckOutput = "";
    try {
      await exec("npx", ["tsc", "--noEmit"], {
        cwd: `${REPO_DIR}/todo-app`,
        timeout: 180_000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      typecheckOk = false;
      typecheckOutput = (e.stdout || e.stderr || e.message || "unknown error").slice(0, 4000);
    }
    return c.json({ revertSha, typecheckOk, typecheckOutput });
  });

  // On-demand verdict: grade a finished run with a second model call. Kept
  // off the automatic run path deliberately — Vertex rate limits are real.
  app.post("/admin/runs/:id/verdict", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    const view = await getRunView(c.req.param("id"));
    if (!view) return c.json({ error: "No such run." }, 404);
    if (view.status === "running") return c.json({ error: "Run is still in progress." }, 409);

    let diff = "(no commit was created for this run)";
    if (view.commitSha) {
      try {
        const { stdout } = await exec("git", ["show", "--stat", "--patch", view.commitSha], {
          cwd: REPO_DIR,
          timeout: 30_000,
          maxBuffer: 10 * 1024 * 1024,
        });
        diff = stdout.slice(0, 12_000);
      } catch {
        diff = "(commit not found in the current history)";
      }
    }

    const grader = new Agent({
      id: "grader",
      name: "Grader",
      instructions:
        "You review changes a coding agent made to a to-do app. Judge only whether the change plausibly satisfies the request, compiles conceptually, and avoids collateral damage. Be terse and honest.",
      model: getModel(),
    });
    const prompt = [
      "Grade this coding-agent run.",
      "",
      "## Change request",
      view.request.slice(0, 4000),
      "",
      "## Run status",
      view.status,
      "",
      "## Run log (tail)",
      view.log.slice(-4000),
      "",
      "## Commit diff",
      diff,
      "",
      'Reply with exactly one line in the form "pass|partial|fail — <one-sentence reason>".',
    ].join("\n");

    try {
      const result = await grader.generate(prompt);
      const verdict = result.text.trim().slice(0, 500) || "no verdict returned";
      await setVerdictById(view.id, verdict);
      return c.json({ verdict });
    } catch (err) {
      return c.json(
        { error: `Grading failed: ${err instanceof Error ? err.message : String(err)}` },
        502,
      );
    }
  });
}
