const CONTEXT_QUERY = `
  query ProgrammaticHandoffDemoContext {
    tenants: allAuthorizedTenants {
      id
      name
      ownerId
    }
    projects(orderBy: { label: ASC }) {
      id
      tenantId
      name
      label
    }
  }
`;

const CREATE_HANDOFF_MUTATION = `
  mutation CreateProgrammaticHandoff($input: CreateInstallationHandoffInput!) {
    createInstallationHandoff(input: $input) {
      installationId
      status
      handoffUrl
    }
  }
`;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PortalRequestError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "PortalRequestError";
    this.status = status;
  }
}

function requireText(value, field, maxLength = 256) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PortalRequestError(`${field} is required.`, 400);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new PortalRequestError(`${field} is too long.`, 400);
  }
  return normalized;
}

function requireUuid(value, field) {
  const normalized = requireText(value, field, 36);
  if (!UUID_PATTERN.test(normalized)) {
    throw new PortalRequestError(`${field} must be a valid ID.`, 400);
  }
  return normalized;
}

function validateEmail(value) {
  const email = requireText(value, "Customer email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PortalRequestError("Enter a valid customer email.", 400);
  }
  return email;
}

export function validateHandoffInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PortalRequestError("Handoff details are required.", 400);
  }

  const cloudProvider = requireText(value.cloudProvider, "Cloud provider", 16);
  if (!["aws", "gcp", "azure"].includes(cloudProvider)) {
    throw new PortalRequestError("Choose AWS, GCP, or Azure.", 400);
  }

  const refType = requireText(value.refType, "Git reference type", 16);
  if (!["all", "branch", "environment"].includes(refType)) {
    throw new PortalRequestError(
      "Choose all refs, a branch, or an environment.",
      400,
    );
  }

  const refPattern =
    refType === "all"
      ? null
      : requireText(value.refPattern, "Git reference pattern", 256);

  return {
    tenantId: requireUuid(value.tenantId, "Workspace"),
    customerEmail: validateEmail(value.customerEmail),
    projectId: requireUuid(value.projectId, "Project"),
    installationName: requireText(
      value.installationName,
      "Installation name",
      128,
    ),
    recipe: requireText(value.recipe, "Recipe", 128),
    stackName: requireText(value.stackName, "Stack name", 128),
    cloudProvider,
    githubOrg: requireText(value.githubOrg, "GitHub organization", 128),
    repoPattern: requireText(value.repoPattern, "Repository pattern", 256),
    refType,
    refPattern,
  };
}

function safePortalMessage(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "Portal could not process the request. Try again.";
  }

  const message = errors.find((error) => typeof error?.message === "string")
    ?.message;

  if (!message) {
    return "Portal could not process the request. Check the details and try again.";
  }
  if (message.startsWith("This installation name already exists")) {
    return message.slice(0, 300);
  }
  if (message.startsWith("Project not found in this tenant")) {
    return "That project is no longer available in the selected workspace. Reload the workspaces and choose another project.";
  }
  if (message.startsWith("Invalid input")) {
    return "Check every handoff field and try again.";
  }
  if (message.startsWith("Forbidden")) {
    return "The developer account cannot create handoffs for that workspace.";
  }
  if (message.startsWith("Unauthorized")) {
    return "Portal rejected the developer token. Sign in again and retry.";
  }
  return "Portal could not process the request. Check the details and try again.";
}

export async function portalGraphql({
  graphqlUrl,
  token,
  query,
  variables,
  fetchImpl = fetch,
}) {
  const endpoint = new URL(graphqlUrl);
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
    throw new PortalRequestError(
      "Portal must use HTTPS unless it is running on localhost.",
      500,
    );
  }

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new PortalRequestError(
      "Portal did not respond. Check the endpoint and try again.",
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new PortalRequestError(
        "Portal rejected the developer token. Sign in again and retry.",
        response.status,
      );
    }
    throw new PortalRequestError(
      "Portal could not process the request. Try again.",
      response.status,
    );
  }
  if (!payload || typeof payload !== "object") {
    throw new PortalRequestError("Portal returned an invalid response.");
  }
  if (payload.errors?.length) {
    throw new PortalRequestError(safePortalMessage(payload.errors), 422);
  }
  return payload.data;
}

export async function getDemoContext(options) {
  const data = await portalGraphql({
    ...options,
    query: CONTEXT_QUERY,
    variables: {},
  });

  return {
    tenants: Array.isArray(data?.tenants) ? data.tenants : [],
    projects: Array.isArray(data?.projects) ? data.projects : [],
  };
}

export async function createInstallationHandoff(options) {
  const input = validateHandoffInput(options.input);
  const data = await portalGraphql({
    ...options,
    query: CREATE_HANDOFF_MUTATION,
    variables: { input },
  });
  const handoff = data?.createInstallationHandoff;

  if (
    !handoff ||
    !UUID_PATTERN.test(handoff.installationId ?? "") ||
    typeof handoff.status !== "string" ||
    typeof handoff.handoffUrl !== "string"
  ) {
    throw new PortalRequestError("Portal returned an invalid handoff.");
  }

  let handoffUrl;
  try {
    handoffUrl = new URL(handoff.handoffUrl);
  } catch {
    throw new PortalRequestError("Portal returned an invalid handoff URL.");
  }
  if (handoffUrl.protocol !== "https:" && handoffUrl.hostname !== "localhost") {
    throw new PortalRequestError("Portal returned an unsafe handoff URL.");
  }

  return {
    installationId: handoff.installationId,
    status: handoff.status,
    // Preserve the literal returned by Portal. This is the URL the customer
    // will receive, so the demo must not silently normalize it.
    handoffUrl: handoff.handoffUrl,
  };
}
