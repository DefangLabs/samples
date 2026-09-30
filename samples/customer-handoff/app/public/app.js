const form = document.querySelector("#handoff-form");
const accessTokenInput = document.querySelector("#access-token");
const loadContextButton = document.querySelector("#load-context");
const detailsSection = document.querySelector("#details-section");
const tenantSelect = document.querySelector("#tenant-id");
const projectSelect = document.querySelector("#project-id");
const refTypeSelect = document.querySelector("#ref-type");
const refPatternInput = document.querySelector("#ref-pattern");
const refPatternField = document.querySelector("#ref-pattern-field");
const errorMessage = document.querySelector("#error-message");
const result = document.querySelector("#result");
const submitButton = document.querySelector("#create-handoff");

let projects = [];

function tokenPayload() {
  return { token: accessTokenInput.value.trim() };
}

function setBusy(button, busy, label) {
  if (!button.dataset.label) button.dataset.label = button.textContent.trim();
  button.disabled = busy;
  button.textContent = busy ? label : button.dataset.label;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearMessages() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
  result.hidden = true;
}

async function request(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "The request could not be completed.");
  }
  return payload;
}

function option(value, label) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function updateProjects() {
  const tenantId = tenantSelect.value;
  projectSelect.replaceChildren(option("", "Select a project"));
  const availableProjects = projects.filter((item) => item.tenantId === tenantId);
  for (const project of availableProjects) {
    projectSelect.append(option(project.id, project.label || project.name));
  }
  if (tenantId && availableProjects.length === 0) {
    projectSelect.replaceChildren(option("", "No projects in this workspace"));
  }
  projectSelect.disabled = !tenantId || availableProjects.length === 0;
}

async function loadContext() {
  clearMessages();
  setBusy(loadContextButton, true, "Loading…");
  try {
    const context = await request("/api/context", tokenPayload());
    if (context.tenants.length === 0) {
      throw new Error(
        "This developer account has no available workspaces. Create a project in Portal first.",
      );
    }
    projects = context.projects;
    tenantSelect.replaceChildren(option("", "Select a workspace"));
    for (const tenant of context.tenants) {
      tenantSelect.append(option(tenant.id, tenant.name));
    }
    detailsSection.disabled = false;
    if (context.tenants.length === 1) {
      tenantSelect.value = context.tenants[0].id;
      updateProjects();
    }
    tenantSelect.focus();
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(loadContextButton, false, "Loading…");
  }
}

function updateRefPattern() {
  const usesAllRefs = refTypeSelect.value === "all";
  refPatternField.hidden = usesAllRefs;
  refPatternInput.disabled = usesAllRefs;
  refPatternInput.required = !usesAllRefs;
}

function formInput() {
  const data = new FormData(form);
  return {
    tenantId: data.get("tenantId"),
    projectId: data.get("projectId"),
    customerEmail: data.get("customerEmail"),
    installationName: data.get("installationName"),
    recipe: data.get("recipe"),
    stackName: data.get("stackName"),
    cloudProvider: data.get("cloudProvider"),
    githubOrg: data.get("githubOrg"),
    repoPattern: data.get("repoPattern"),
    refType: data.get("refType"),
    refPattern: data.get("refPattern") || null,
  };
}

function showResult(handoff) {
  document.querySelector("#result-installation").textContent =
    handoff.installationId;
  document.querySelector("#result-status").textContent = handoff.status;
  document.querySelector("#result-url").textContent = handoff.handoffUrl;
  document.querySelector("#open-handoff").href = handoff.handoffUrl;
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function createHandoff(event) {
  event.preventDefault();
  clearMessages();
  setBusy(submitButton, true, "Creating handoff…");
  try {
    const handoff = await request("/api/handoffs", {
      ...tokenPayload(),
      input: formInput(),
    });
    showResult(handoff);
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(submitButton, false, "Creating handoff…");
  }
}

async function initialize() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    const config = await response.json();
    document.querySelector("#portal-host").textContent = config.portalHost;
  } catch {
    showError("The demo configuration could not be loaded. Refresh and try again.");
  }
}

loadContextButton.addEventListener("click", loadContext);
tenantSelect.addEventListener("change", updateProjects);
refTypeSelect.addEventListener("change", updateRefPattern);
form.addEventListener("submit", createHandoff);
document.querySelector("#copy-url").addEventListener("click", async (event) => {
  const url = document.querySelector("#result-url").textContent;
  await navigator.clipboard.writeText(url);
  event.currentTarget.textContent = "Copied";
  window.setTimeout(() => {
    event.currentTarget.textContent = "Copy";
  }, 1600);
});

updateRefPattern();
initialize();
