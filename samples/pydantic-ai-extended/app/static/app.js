/* global fetch */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------------
  const seedBtn = document.getElementById("seed-btn");
  const seedStatus = document.getElementById("seed-status");
  const seedUpdated = document.getElementById("seed-updated");
  const statTickets = document.getElementById("stat-tickets");
  const statAlerts = document.getElementById("stat-alerts");
  const statClassified = document.getElementById("stat-classified");
  const statQueue = document.getElementById("stat-queue");
  const ticketList = document.getElementById("ticket-list");
  const alertList = document.getElementById("alert-list");
  const chatLog = document.getElementById("chat-log");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const suggestions = document.getElementById("suggestions");

  let sending = false;
  const messages = [];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function formatTimestamp(ts) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  function priorityClass(p) {
    return "status-" + (p || "low");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Item card rendering
  // ---------------------------------------------------------------------------
  function renderItemCard(item, showAssignee) {
    const tags = (item.tags || [])
      .map(function (t) {
        return '<span class="tag-pill">' + escapeHtml(t) + "</span>";
      })
      .join("");

    return (
      '<div class="item-card">' +
      '<div class="item-topline">' +
      '<span class="source-pill">' +
      escapeHtml(item.source) +
      "</span>" +
      (item.priority
        ? '<span class="priority-pill ' +
          priorityClass(item.priority) +
          '">' +
          escapeHtml(item.priority) +
          "</span>"
        : "") +
      "</div>" +
      "<h3>" +
      escapeHtml(item.title) +
      "</h3>" +
      '<p class="item-body">' +
      escapeHtml(item.body) +
      "</p>" +
      '<div class="meta-row">' +
      (item.category
        ? "<span>" + escapeHtml(item.category) + "</span>"
        : "") +
      (showAssignee && item.assignee
        ? "<span>" + escapeHtml(item.assignee) + "</span>"
        : "") +
      (item.status ? "<span>" + escapeHtml(item.status) + "</span>" : "") +
      "</div>" +
      (tags ? '<div class="tag-row">' + tags + "</div>" : "") +
      "</div>"
    );
  }

  // ---------------------------------------------------------------------------
  // Dashboard polling
  // ---------------------------------------------------------------------------
  let pollTimer = null;

  async function refreshDashboard() {
    try {
      const [dash, items] = await Promise.all([
        fetch("/api/dashboard").then(function (r) {
          return r.json();
        }),
        fetch("/api/items").then(function (r) {
          return r.json();
        }),
      ]);

      var run = dash.latestRun;
      if (run) {
        if (run.status === "running" || run.status === "queued") {
          seedStatus.textContent =
            "Processing " + run.processedItems + "/" + run.totalItems;
        } else if (run.status === "completed") {
          seedStatus.textContent = "Ready \u00b7 " + run.totalItems + " items";
        } else {
          seedStatus.textContent = "Run failed";
        }
        seedUpdated.textContent = "Updated " + formatTimestamp(run.updatedAt);
      }

      statTickets.textContent = dash.counts.ticketCount;
      statAlerts.textContent = dash.counts.alertCount;
      statClassified.textContent = dash.counts.classifiedCount;
      statQueue.textContent = dash.queue.pending;

      if (items.tickets.length > 0) {
        ticketList.innerHTML = items.tickets
          .map(function (t) {
            return renderItemCard(t, true);
          })
          .join("");
      }

      if (items.alerts.length > 0) {
        alertList.innerHTML = items.alerts
          .map(function (a) {
            return renderItemCard(a, false);
          })
          .join("");
      }
    } catch (e) {
      /* ignore transient errors */
    }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(refreshDashboard, 3000);
  }

  // ---------------------------------------------------------------------------
  // Seed
  // ---------------------------------------------------------------------------
  seedBtn.addEventListener("click", async function () {
    seedBtn.disabled = true;
    seedBtn.textContent = "Queueing\u2026";
    try {
      await fetch("/api/items/seed", { method: "POST" });
      seedStatus.textContent = "Queued";
      startPolling();
    } catch (e) {
      seedStatus.textContent = "Failed to queue";
    } finally {
      seedBtn.disabled = false;
      seedBtn.textContent = "Generate sample items";
    }
  });

  // ---------------------------------------------------------------------------
  // Chat
  // ---------------------------------------------------------------------------
  function renderMessages() {
    if (messages.length === 0) return;
    if (suggestions) suggestions.style.display = "none";

    chatLog.innerHTML = messages
      .map(function (m) {
        var cls = "chat-message " + m.role;
        if (m.error) cls += " error";
        return '<div class="' + cls + '">' + escapeHtml(m.text) + "</div>";
      })
      .join("");

    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function updateSendButton() {
    chatSend.disabled = sending || !chatInput.value.trim();
  }

  chatInput.addEventListener("input", updateSendButton);

  // Suggestion chips
  document.querySelectorAll(".suggestion-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      chatInput.value = btn.getAttribute("data-prompt");
      updateSendButton();
    });
  });

  chatForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text || sending) return;
    sending = true;
    updateSendButton();
    chatInput.value = "";

    messages.push({ role: "user", text: text });
    messages.push({ role: "assistant", text: "", streaming: true });
    renderMessages();

    try {
      var resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, stream: true }),
      });

      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var assistantMsg = messages[messages.length - 1];

      while (true) {
        var result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop();

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line) continue;
          try {
            var event = JSON.parse(line);
            if (event.type === "delta") {
              assistantMsg.text += event.text;
            } else if (event.type === "error") {
              assistantMsg.text += "[Error: " + event.message + "]";
              assistantMsg.error = true;
            }
          } catch (parseErr) {
            /* skip malformed lines */
          }
        }
        renderMessages();
      }

      assistantMsg.streaming = false;
    } catch (err) {
      var last = messages[messages.length - 1];
      last.text = "Failed to get a response: " + err.message;
      last.error = true;
    }

    sending = false;
    updateSendButton();
    renderMessages();
  });

  // Initial load
  refreshDashboard();
  startPolling();
})();
