import type { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { adminTokenConfigured, getAdminIdentity } from "./auth.js";
import { pool } from "./db.js";
import { executeRun } from "./execute.js";
import { createRun, getRun } from "./runs.js";

interface FeedbackRow {
  id: string;
  body: string;
  status: string;
  email: string;
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
  .wrap { max-width: 1040px; margin: 0 auto; padding: 32px 24px; }
  .grid { display: grid; gap: 28px; grid-template-columns: minmax(0,1fr) minmax(300px,0.8fr); }
  @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #7c3aed; }
  h1 { margin: 8px 0 0; font-size: 28px; }
  .card { border: 1px solid #e2e8f0; background: #fff; border-radius: 16px; overflow: hidden; }
  .fb { padding: 18px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
  .fb:first-child { border-top: 0; }
  .fb .meta { font-size: 12px; color: #94a3b8; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .fb .meta .email { color: #475569; font-weight: 600; }
  .fb .body { margin: 8px 0 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
  .pill { border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .pill.new { background: #fef3c7; color: #b45309; }
  .pill.sent { background: #d1fae5; color: #047857; }
  .empty { padding: 56px 24px; text-align: center; color: #94a3b8; }
  .panel { background: #0f172a; color: #fff; border-radius: 16px; padding: 24px; }
  .panel h2 { margin: 6px 0 0; }
  .panel p { color: #cbd5e1; font-size: 14px; line-height: 1.5; }
  textarea { width: 100%; margin-top: 16px; resize: vertical; min-height: 150px; border-radius: 12px; border: 1px solid #334155; background: #1e293b; color: #fff; padding: 14px; font: inherit; font-size: 14px; }
  button.send { margin-top: 14px; width: 100%; border: 0; border-radius: 12px; background: #8b5cf6; color: #fff; font-weight: 700; padding: 12px; cursor: pointer; }
  button.send:disabled { opacity: .6; cursor: default; }
  .err { margin-top: 12px; background: rgba(159,18,57,.4); color: #fecdd3; border-radius: 8px; padding: 8px 12px; font-size: 14px; }
  .run { margin-top: 24px; }
  .run .head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
  .run pre { margin: 0; max-height: 28rem; min-height: 10rem; overflow: auto; white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 20px; font: 12px/1.5 ui-monospace, monospace; }
  .status { border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  .status.running { background: #ede9fe; color: #6d28d9; }
  .status.done { background: #d1fae5; color: #047857; }
  .status.failed { background: #ffe4e6; color: #be123c; }
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

function renderConsole(feedback: FeedbackRow[], who: string): string {
  const items = feedback.length
    ? feedback
        .map((item) => {
          const selectable = item.status === "new";
          return `<div class="fb">
            <input type="checkbox" class="fb-check" value="${escapeHtml(item.id)}" ${selectable ? "" : "disabled"} aria-label="Select feedback from ${escapeHtml(item.email)}" style="margin-top:4px" />
            <div style="min-width:0;flex:1">
              <div class="meta"><span class="email">${escapeHtml(item.email)}</span><span>•</span><time>${escapeHtml(item.created_at.toISOString())}</time><span class="pill ${item.status === "new" ? "new" : "sent"}">${escapeHtml(item.status)}</span></div>
              <p class="body">${escapeHtml(item.body)}</p>
            </div>
          </div>`;
        })
        .join("")
    : `<p class="empty">No feedback yet. Users can send some from the app.</p>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin console</title><style>${PAGE_STYLE}</style></head>
  <body>
    <div class="bar"><span class="title">Admin console <span style="color:#64748b;font-weight:400">— coding agent</span></span><span class="who">${escapeHtml(who)}</span></div>
    <div class="wrap"><div class="grid">
      <section>
        <p class="eyebrow">User feedback</p>
        <h1>Choose what to improve</h1>
        <div class="card" style="margin-top:16px">${items}</div>
      </section>
      <aside>
        <div class="panel">
          <p class="eyebrow" style="color:#c4b5fd">Coding agent</p>
          <h2>Shape the request</h2>
          <p>Add context or a specific direction before the selected feedback reaches Mastra.</p>
          <textarea id="instructions" maxlength="5000" placeholder="Instructions for the coding agent"></textarea>
          <button class="send" id="send" type="button">Send to coding agent</button>
          <div id="error"></div>
        </div>
        <div class="card run" id="run" style="display:none">
          <div class="head"><div><p class="eyebrow" style="color:#94a3b8">Run</p><p id="run-id" style="font:12px ui-monospace,monospace;color:#475569;margin:4px 0 0"></p></div><span class="status running" id="run-status">connecting</span></div>
          <pre id="run-log">Reading agent output…</pre>
        </div>
      </aside>
    </div></div>
    <script>${CONSOLE_SCRIPT}</script>
  </body></html>`;
}

const CONSOLE_SCRIPT = `
  const KEY = "self-updating-mastra-active-run";
  const sendBtn = document.getElementById("send");
  const errorEl = document.getElementById("error");
  const runEl = document.getElementById("run");
  const runIdEl = document.getElementById("run-id");
  const runStatusEl = document.getElementById("run-status");
  const runLogEl = document.getElementById("run-log");
  let pollTimer;

  function selectedIds() {
    return Array.from(document.querySelectorAll(".fb-check:checked")).map((el) => el.value);
  }
  function refreshSendLabel() {
    const n = selectedIds().length;
    sendBtn.textContent = "Send to coding agent" + (n ? " (" + n + ")" : "");
  }
  document.querySelectorAll(".fb-check").forEach((el) => el.addEventListener("change", refreshSendLabel));
  refreshSendLabel();

  function showError(msg) { errorEl.innerHTML = msg ? '<p class="err">' + msg + '</p>' : ""; }

  async function poll(id) {
    let res;
    try { res = await fetch("/admin/runs/" + encodeURIComponent(id), { cache: "no-store" }); }
    catch { pollTimer = setTimeout(() => poll(id), 4000); return; }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) { showError((data && data.error) || "Could not read run status."); pollTimer = setTimeout(() => poll(id), 4000); return; }
    runEl.style.display = "";
    runIdEl.textContent = id.slice(0, 8);
    runStatusEl.textContent = data.status;
    runStatusEl.className = "status " + data.status;
    runLogEl.textContent = data.log || "Reading agent output…";
    if (data.status === "running") { pollTimer = setTimeout(() => poll(id), 2000); }
    else { localStorage.removeItem(KEY); setTimeout(() => location.reload(), 1500); }
  }

  async function dispatch() {
    sendBtn.disabled = true; showError("");
    let res;
    try {
      res = await fetch("/admin/dispatch", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedbackIds: selectedIds(), instructions: document.getElementById("instructions").value.trim() }),
      });
    } catch { sendBtn.disabled = false; showError("The coding agent is unavailable."); return; }
    const data = await res.json().catch(() => null);
    sendBtn.disabled = false;
    if (!res.ok || !data || !data.runId) { showError((data && data.error) || "Could not start the coding agent."); return; }
    localStorage.setItem(KEY, data.runId);
    runEl.style.display = ""; runLogEl.textContent = "Change request accepted. Waiting for the agent…";
    poll(data.runId);
  }
  sendBtn.addEventListener("click", dispatch);

  const active = localStorage.getItem(KEY);
  if (active) poll(active);
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

    const result = await pool.query<FeedbackRow>(
      'SELECT f."id", f."body", f."status", f."created_at", u."email" FROM "feedback" f JOIN "user" u ON u."id" = f."user_id" ORDER BY f."created_at" DESC',
    );
    return c.html(renderConsole(result.rows, identity.email));
  });

  app.post("/admin/dispatch", async (c) => {
    // Mirror the app's behavior: non-admins get a 404, not a hint the route exists.
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);

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
      return c.json({ error: "Select feedback or add instructions for the coding agent." }, 400);
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

    const run = createRun(changeRequest);
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
    const run = getRun(c.req.param("id"));
    if (!run) return c.json({ error: "No such run." }, 404);
    return c.json({ status: run.status, log: run.log.join("\n") });
  });
}
