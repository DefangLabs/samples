import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Agent } from "@mastra/core/agent";
import type { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { adminTokenConfigured, getAdminIdentity } from "./auth.js";
import { pool } from "./db.js";
import { getDeployment, listDeployments } from "./deployments.js";
import { executeRun, getActiveRun } from "./execute.js";
import { headSha, history, isRevertable, REPO_DIR, revertCommit } from "./git.js";
import { getModel } from "./model.js";
import {
  cancelPublish,
  confirmDeploy,
  getPublishState,
  isPublishActive,
  publishEnabled,
  startPublish,
} from "./publish.js";
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
  .pub { border: 1px solid #e2e8f0; background: #fff; border-radius: 16px; padding: 18px; margin-top: 24px; }
  .pub h2 { margin: 6px 0 0; font-size: 17px; }
  .pub .meta { font-size: 12px; color: #64748b; margin-top: 6px; }
  .pub .warn { margin-top: 12px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 10px; padding: 10px 12px; font-size: 13px; line-height: 1.5; }
  .pub .err { margin-top: 12px; background: #ffe4e6; color: #be123c; border-radius: 10px; padding: 10px 12px; font-size: 13px; }
  .pub .ok { margin-top: 12px; background: #d1fae5; color: #047857; border-radius: 10px; padding: 10px 12px; font-size: 13px; }
  .pub button.go { margin-top: 12px; width: 100%; border: 0; border-radius: 12px; background: #0f172a; color: #fff; font-weight: 700; padding: 12px; cursor: pointer; }
  .pub button.danger { background: #dc2626; }
  .pub button.go:disabled { opacity: .6; cursor: default; }
  .pub a.login { display: block; margin-top: 12px; text-align: center; border-radius: 12px; background: #7c3aed; color: #fff; font-weight: 700; padding: 12px; text-decoration: none; }
  .pub .who { margin-top: 12px; font: 12px ui-monospace, monospace; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; white-space: pre-wrap; }
  .pub pre { margin: 12px 0 0; max-height: 12rem; overflow: auto; white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 10px; font: 11px/1.5 ui-monospace, monospace; }
  .pub .deprow { display: flex; gap: 8px; align-items: center; font-size: 12px; color: #64748b; padding: 6px 0; border-top: 1px solid #f1f5f9; }
  .pub .deprow:first-of-type { border-top: 0; }
  .pill.cd_launched, .pill.deploying, .pill.ready, .pill.awaiting_login { background: #ede9fe; color: #6d28d9; }
  .pill.live { background: #d1fae5; color: #047857; }
  .pill.cancelled, .pill.unknown { background: #f1f5f9; color: #64748b; }
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
        <div class="pub" id="publish" style="display:none">
          <p class="eyebrow">Production</p>
          <h2>Publish</h2>
          <div id="pub-body"></div>
        </div>
        <div class="pub" id="reboot">
          <p class="eyebrow">Recovery</p>
          <h2>Reboot environment</h2>
          <p class="meta">Restart this dev container when a change has wedged it beyond what reverting a commit can fix. It comes back from the last published image, so edits made since the last publish are discarded. This console drops for a moment and returns.</p>
          <button class="go danger" id="reboot-btn" type="button">Reboot and discard unpublished edits</button>
          <div id="reboot-msg"></div>
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
      if (!data.typecheckOk) alert("Reverted, but the app no longer typechecks — later changes may depend on this commit. Consider reverting the revert, or dispatch a repair run.\\n\\n" + (data.typecheckOutput || ""));
      loadData();
    } finally { btn.disabled = false; }
  }

  function showLoadError(ids, status) {
    for (const id of ids) $(id).innerHTML = '<p class="empty">Failed to load' + (status ? " (HTTP " + status + ")" : "") + ". Refresh to retry.</p>";
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
      } else showLoadError(["feedback", "runs"], dataRes.status);
      if (histRes.ok) {
        const hist = await histRes.json();
        renderHistory(hist.history || []);
      } else showLoadError(["history"], histRes.status);
    } catch {
      showLoadError(["feedback", "runs", "history"], 0);
    }
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

  const PUB_WARNING = "This runs defang compose up from the live dev workspace and overwrites BOTH services: app (production — what all users see) and dev (this environment, including this console; the VM is replaced, so this page will drop and come back on the new build, ~10–15 min). The database is managed and keeps all data.";
  let pubTimer = null;
  let pubLogId = null;   // deployment whose log the viewer is showing (or null)
  let pubLogText = "";   // its fetched log text

  function pubCancelBtn() {
    const b = document.createElement("button"); b.className = "mini"; b.type = "button"; b.style.marginTop = "10px"; b.textContent = "Cancel publish";
    b.addEventListener("click", async () => { await fetch("/admin/publish/cancel", { method: "POST" }); pollPublish(); });
    return b;
  }

  function renderPublish(data) {
    const card = $("publish");
    if (!data.enabled) { card.style.display = "none"; return; }
    card.style.display = "";
    const s = data.state || {}; const phase = s.phase || "idle";
    const body = $("pub-body"); body.innerHTML = "";
    const meta = document.createElement("p"); meta.className = "meta";
    meta.textContent = "HEAD " + (data.head || "?") + " · " + data.commitsSincePublish + " change(s) since last publish";
    body.append(meta);
    if (phase === "awaiting-login" || phase === "ready" || phase === "deploying") {
      const warn = document.createElement("div"); warn.className = "warn"; warn.textContent = PUB_WARNING; body.append(warn);
    }
    if (phase === "awaiting-login") {
      if (s.loginUrl) {
        const a = document.createElement("a"); a.className = "login"; a.href = s.loginUrl; a.target = "_blank"; a.rel = "noopener";
        a.textContent = "1 · Sign in to Defang to authorize this publish";
        body.append(a);
        const hint = document.createElement("p"); hint.className = "meta"; hint.textContent = "Complete the login in the new tab. This panel updates by itself — the deploy button appears once you're signed in."; body.append(hint);
      } else {
        const hint = document.createElement("p"); hint.className = "meta"; hint.textContent = "Starting defang login…"; body.append(hint);
      }
      body.append(pubCancelBtn());
    } else if (phase === "ready") {
      const who = document.createElement("div"); who.className = "who"; who.textContent = "Signed in as:\\n" + (s.whoami || "?"); body.append(who);
      const go = document.createElement("button"); go.className = "go danger"; go.type = "button"; go.textContent = "2 · Deploy and overwrite dev + app";
      go.addEventListener("click", async () => { go.disabled = true; await fetch("/admin/publish/deploy", { method: "POST" }); pollPublish(); });
      body.append(go, pubCancelBtn());
    } else if (phase === "deploying" || phase === "cd-launched") {
      const note = document.createElement("div"); note.className = phase === "cd-launched" ? "ok" : "warn";
      note.textContent = phase === "cd-launched"
        ? "Deployment launched in the cloud. This environment restarts on the new build — the console will drop and come back."
        : "Publishing… uploading the workspace and starting the deployment.";
      body.append(note);
      const pre = document.createElement("pre"); pre.textContent = (s.logTail || []).slice(-30).join("\\n") || "…"; body.append(pre);
    } else {
      if (phase === "failed" && s.error) { const err = document.createElement("div"); err.className = "err"; err.textContent = s.error; body.append(err); }
      if (phase === "cancelled") { const note = document.createElement("p"); note.className = "meta"; note.textContent = "Publish cancelled."; body.append(note); }
      // A failed publish keeps its full log in the deployments table. Open it
      // automatically so the error is visible here instead of vanishing (the
      // whole reason the panel dropped the streamed log used to be confusing).
      if (phase === "failed" && s.deploymentId && pubLogId === null) viewDeployment(s.deploymentId);
      const go = document.createElement("button"); go.className = "go"; go.type = "button"; go.textContent = "Publish to production…";
      go.disabled = !!data.runActive;
      if (data.runActive) go.title = "A run is in progress";
      go.addEventListener("click", async () => {
        go.disabled = true;
        const res = await fetch("/admin/publish/start", { method: "POST" });
        const d = await res.json().catch(() => null);
        if (!res.ok) { alert((d && d.error) || "Could not start the publish."); go.disabled = false; return; }
        pollPublish();
      });
      body.append(go);
    }
    if (data.deployments && data.deployments.length) {
      const wrap = document.createElement("div"); wrap.style.marginTop = "12px";
      for (const d of data.deployments) {
        const row = document.createElement("div"); row.className = "deprow"; row.style.cursor = "pointer"; row.title = "View this deployment's log";
        const pill = document.createElement("span"); pill.className = "pill " + d.status; pill.textContent = d.status.replace(/_/g, " ");
        const id = document.createElement("span"); id.className = "mono"; id.textContent = d.id.slice(0, 8);
        const by = document.createElement("span"); by.textContent = d.triggeredBy || ""; by.style.marginLeft = "auto";
        const size = document.createElement("span"); size.className = "meta"; size.style.marginLeft = "8px";
        size.textContent = d.logChars ? "log ›" : "no log";
        row.append(pill, id, by, size);
        row.addEventListener("click", () => viewDeployment(d.id));
        wrap.append(row);
      }
      body.append(wrap);
    }
    // On-demand deployment log viewer (survives re-renders via pubLogId).
    if (pubLogId) {
      const view = document.createElement("div"); view.style.marginTop = "12px";
      const head = document.createElement("div"); head.className = "meta"; head.style.display = "flex"; head.style.alignItems = "center"; head.style.gap = "8px";
      const label = document.createElement("span"); label.textContent = "Deployment " + pubLogId.slice(0, 8) + " log";
      const close = document.createElement("button"); close.className = "mini"; close.type = "button"; close.textContent = "Close"; close.style.marginLeft = "auto";
      close.addEventListener("click", () => { pubLogId = null; pollPublish(); });
      head.append(label, close);
      const pre = document.createElement("pre"); pre.id = "pub-log"; pre.textContent = pubLogText || "Loading…";
      view.append(head, pre); body.append(view);
    }
    const activePhase = phase === "awaiting-login" || phase === "ready" || phase === "deploying";
    if (activePhase && !pubTimer) pubTimer = setTimeout(pollPublish, 2000);
  }

  async function viewDeployment(id) {
    pubLogId = id; pubLogText = "Loading…";
    const pre = $("pub-log"); if (pre) pre.textContent = pubLogText;
    try {
      const res = await fetch("/admin/deployments/" + encodeURIComponent(id), { cache: "no-store" });
      const d = await res.json().catch(() => null);
      pubLogText = res.ok && d ? (d.log && d.log.trim() ? d.log : "(no log was captured for this deployment)") : ((d && d.error) || "Failed to load the deployment log.");
    } catch { pubLogText = "Failed to load the deployment log."; }
    const pre2 = $("pub-log"); if (pre2) pre2.textContent = pubLogText; else pollPublish();
  }

  async function pollPublish() {
    pubTimer = null;
    try {
      const res = await fetch("/admin/publish", { cache: "no-store" });
      if (res.ok) { renderPublish(await res.json()); return; }
    } catch {}
    pubTimer = setTimeout(pollPublish, 4000);
  }

  async function reboot() {
    if (!confirm("Reboot the environment? Edits made since the last publish are discarded, and this console drops for a moment while the container restarts.")) return;
    const btn = $("reboot-btn"); btn.disabled = true; btn.textContent = "Rebooting…";
    const ok = () => { $("reboot-msg").innerHTML = '<p class="ok">Rebooting — this console will drop and come back on the fresh container.</p>'; };
    try {
      const res = await fetch("/admin/reboot", { method: "POST" });
      // The container may be killed before the response arrives; treat a
      // dropped connection as success (that IS the reboot happening).
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        alert((d && d.error) || "Could not reboot."); btn.disabled = false; btn.textContent = "Reboot and discard unpublished edits"; return;
      }
      ok();
    } catch { ok(); }
  }

  $("send").addEventListener("click", dispatch);
  $("grade").addEventListener("click", grade);
  $("reboot-btn").addEventListener("click", reboot);
  loadData();
  pollPublish();
  const activeRun = localStorage.getItem(KEY);
  if (activeRun) poll(activeRun);
`;

// The console script above is authored in a TS template literal, where escapes
// like \n are processed server-side — client-facing ones must be written \\n
// or the browser receives a raw newline inside a string literal and the whole
// script fails to parse (every panel then hangs at "Loading…"). Compiling it
// here (without running it) makes that a boot failure instead.
new Function(CONSOLE_SCRIPT);

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
    if (isPublishActive()) {
      return c.json({ error: "A publish is in progress; the workspace is locked until it finishes." }, 409);
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

  // ---- Publish (self-redeploy) -------------------------------------------
  // The dev container redeploys its own Compose project. Admin-gated, and the
  // Fabric side is authorized by an interactive login the admin completes in
  // a new tab for EVERY publish — no stored deploy token.

  app.get("/admin/publish", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    const entries = await history(50);
    const sincePublish = entries.findIndex((e) => e.deploymentId !== null);
    const head = await headSha();
    return c.json({
      enabled: publishEnabled(),
      state: getPublishState(),
      runActive: getActiveRun() !== null,
      head: head ? head.slice(0, 8) : null,
      commitsSincePublish: sincePublish === -1 ? entries.length : sincePublish,
      deployments: await listDeployments(5),
    });
  });

  app.post("/admin/publish/start", async (c) => {
    const identity = await getAdminIdentity(c);
    if (!identity) return c.json({ error: "Not found." }, 404);
    if (!publishEnabled()) return c.json({ error: "Publishing is not enabled in this environment." }, 400);
    const active = getActiveRun();
    if (active) {
      return c.json({ error: `A run is in progress (${active.id.slice(0, 8)}); wait for it to finish.` }, 409);
    }
    try {
      return c.json({ state: await startPublish(identity.email) });
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
    }
  });

  app.post("/admin/publish/deploy", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    if (getPublishState().phase !== "ready") {
      return c.json({ error: "Publish is not ready to deploy (complete the Defang login first)." }, 409);
    }
    return c.json({ state: await confirmDeploy() });
  });

  app.post("/admin/publish/cancel", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    return c.json({ state: await cancelPublish() });
  });

  // Reboot ("die"): the escape hatch when a run has left the live environment
  // wedged past what a git revert can fix (a corrupt dev-server process, a
  // broken node_modules edit, a hung port). Killing PID 1 stops the container;
  // its `restart: unless-stopped` policy brings it back from the last published
  // image, so it returns to the last-published state and drops any edits made
  // since. Refused mid-run/mid-publish so it can't tear down an in-flight write.
  app.post("/admin/reboot", async (c) => {
    const identity = await getAdminIdentity(c);
    if (!identity) return c.json({ error: "Not found." }, 404);
    if (getActiveRun()) return c.json({ error: "A run is in progress; wait for it to finish." }, 409);
    if (isPublishActive()) {
      return c.json({ error: "A publish is in progress; wait for it to finish." }, 409);
    }
    console.log(`[admin] reboot requested by ${identity.email}; terminating container`);
    // Delay the kill so this response flushes first; the client expects the
    // console to drop and reconnect on the fresh container.
    setTimeout(() => {
      try {
        process.kill(1, "SIGKILL");
      } catch (err) {
        console.error("reboot: could not signal PID 1", err);
      }
    }, 250);
    return c.json({ ok: true });
  });

  // Full persisted log for one deployment. The publish list is kept light (no
  // log bodies) so the panel can poll it cheaply; the console fetches a
  // deployment's log on demand — including for FAILED publishes, whose logs
  // used to vanish from the UI the moment the panel left the deploying phase.
  app.get("/admin/deployments/:id", async (c) => {
    if (!(await getAdminIdentity(c))) return c.json({ error: "Not found." }, 404);
    const view = await getDeployment(c.req.param("id"));
    if (!view) return c.json({ error: "No such deployment." }, 404);
    return c.json(view);
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
