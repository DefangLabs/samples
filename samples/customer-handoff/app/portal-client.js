import { createHash } from "node:crypto";

export const CREATE_HANDOFF_MUTATION = `
  mutation CreateInstallationHandoff($input: CreateInstallationHandoffInput!) {
    createInstallationHandoff(input: $input) {
      installationId
      status
      handoffUrl
    }
  }
`;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVIDERS = new Set(["aws", "gcp", "azure"]);
const REF_TYPES = new Set(["all", "branch", "environment"]);
const INITIAL_STATUSES = new Set(["pending", "ready"]);

export class HandoffError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "HandoffError";
    this.status = status;
  }
}

function requireText(value, name, maxLength = 256, status = 500) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HandoffError(`${name} is required.`, status);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new HandoffError(`${name} is too long.`, status);
  }
  return normalized;
}

function requireUuid(value, name) {
  const normalized = requireText(value, name, 36);
  if (!UUID_PATTERN.test(normalized)) {
    throw new HandoffError(`${name} must be a UUID.`, 500);
  }
  return normalized;
}

function requireHttpsUrl(value, name, { localhost = false } = {}) {
  let url;
  try {
    url = new URL(requireText(value, name, 2_048));
  } catch {
    throw new HandoffError(`${name} must be a valid URL.`, 500);
  }
  if (
    url.protocol !== "https:" &&
    !(localhost && ["localhost", "127.0.0.1"].includes(url.hostname))
  ) {
    throw new HandoffError(`${name} must use HTTPS.`, 500);
  }
  return url;
}

export function readConfig(env = process.env) {
  const graphqlUrl = requireHttpsUrl(
    env.PORTAL_GRAPHQL_URL ?? "https://graphql.defang.io/v1/graphql",
    "PORTAL_GRAPHQL_URL",
    { localhost: true },
  );
  const handoffOrigin = requireHttpsUrl(
    env.PORTAL_HANDOFF_ORIGIN ?? "https://portal.defang.io",
    "PORTAL_HANDOFF_ORIGIN",
    { localhost: true },
  );
  const cloudProvider = requireText(
    env.DEFANG_CLOUD_PROVIDER ?? "aws",
    "DEFANG_CLOUD_PROVIDER",
    16,
  );
  const refType = requireText(
    env.GITHUB_REF_TYPE ?? "environment",
    "GITHUB_REF_TYPE",
    16,
  );
  const stackName = requireText(
    env.DEFANG_STACK_NAME ?? "production",
    "DEFANG_STACK_NAME",
    128,
  );
  if (!PROVIDERS.has(cloudProvider)) {
    throw new HandoffError(
      "DEFANG_CLOUD_PROVIDER must be aws, gcp, or azure.",
      500,
    );
  }
  if (!REF_TYPES.has(refType)) {
    throw new HandoffError(
      "GITHUB_REF_TYPE must be all, branch, or environment.",
      500,
    );
  }

  const refPattern =
    refType === "all"
      ? null
      : requireText(
          env.GITHUB_REF_PATTERN ??
            (refType === "environment" ? `defang-${stackName}` : undefined),
          "GITHUB_REF_PATTERN",
        );

  return Object.freeze({
    graphqlUrl: graphqlUrl.toString(),
    handoffOrigin: handoffOrigin.origin,
    accessToken: requireText(
      env.PORTAL_ACCESS_TOKEN,
      "PORTAL_ACCESS_TOKEN",
      16_384,
    ),
    tenantId: requireUuid(env.DEFANG_TENANT_ID, "DEFANG_TENANT_ID"),
    projectId: requireUuid(env.DEFANG_PROJECT_ID, "DEFANG_PROJECT_ID"),
    recipe: requireText(env.DEFANG_RECIPE ?? "default", "DEFANG_RECIPE", 128),
    stackName,
    cloudProvider,
    githubOrg: requireText(env.GITHUB_ORG, "GITHUB_ORG", 128),
    githubRepository: requireText(
      env.GITHUB_REPOSITORY,
      "GITHUB_REPOSITORY",
      256,
    ),
    refType,
    refPattern,
    installationPrefix: requireText(
      env.INSTALLATION_NAME_PREFIX ?? "customer",
      "INSTALLATION_NAME_PREFIX",
      48,
    ),
  });
}

export function validateBusinessEvent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HandoffError("Customer details are required.", 400);
  }
  const externalReference = requireText(
    value.externalReference,
    "External reference",
    256,
    400,
  );
  const customerEmail = requireText(
    value.customerEmail,
    "Customer email",
    320,
    400,
  ).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new HandoffError("Enter a valid customer email.", 400);
  }
  return { customerEmail, externalReference };
}

/**
 * Portal does not yet accept a vendor idempotency key or external reference.
 * A stable digest gives identical retries the same installation name without
 * disclosing the developer's order/entitlement identifier to Defang.
 */
export function installationNameFor(prefix, externalReference) {
  const digest = createHash("sha256")
    .update(externalReference, "utf8")
    .digest("hex")
    .slice(0, 24);
  return `${prefix}-${digest}`;
}

export function buildHandoffInput(config, event) {
  const { customerEmail, externalReference } = validateBusinessEvent(event);
  return {
    tenantId: config.tenantId,
    customerEmail,
    projectId: config.projectId,
    installationName: installationNameFor(
      config.installationPrefix,
      externalReference,
    ),
    recipe: config.recipe,
    stackName: config.stackName,
    cloudProvider: config.cloudProvider,
    githubOrg: config.githubOrg,
    repoPattern: config.githubRepository,
    refType: config.refType,
    refPattern: config.refPattern,
  };
}

function safePortalMessage(errors) {
  const message = Array.isArray(errors)
    ? errors.find((error) => typeof error?.message === "string")?.message
    : null;
  if (message?.startsWith("This installation name already exists")) {
    return `${message.slice(0, 300)} Confirm that this retry uses the original customer and configuration.`;
  }
  if (message?.startsWith("Project not found in this tenant")) {
    return "The configured project is not available in the developer workspace. Check DEFANG_PROJECT_ID and DEFANG_TENANT_ID.";
  }
  if (message?.startsWith("Forbidden")) {
    return "The configured Portal credential cannot create handoffs for this workspace.";
  }
  if (message?.startsWith("Unauthorized")) {
    return "Portal rejected the configured credential. Replace the expired credential and retry.";
  }
  return "Portal could not create the handoff. Check the server configuration and retry.";
}

async function portalGraphql(config, query, variables, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(config.graphqlUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${config.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new HandoffError(
      "Portal did not respond. Check PORTAL_GRAPHQL_URL and retry.",
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new HandoffError(
        "Portal rejected the configured credential. Replace the expired credential and retry.",
        response.status,
      );
    }
    throw new HandoffError(
      "Portal could not create the handoff.",
      response.status,
    );
  }
  if (!payload || typeof payload !== "object") {
    throw new HandoffError("Portal returned an invalid response.");
  }
  if (payload.errors?.length) {
    throw new HandoffError(safePortalMessage(payload.errors), 422);
  }
  return payload.data;
}

export async function createInstallationHandoff({
  config,
  event,
  fetchImpl = fetch,
}) {
  const input = buildHandoffInput(config, event);
  const data = await portalGraphql(
    config,
    CREATE_HANDOFF_MUTATION,
    { input },
    fetchImpl,
  );
  const handoff = data?.createInstallationHandoff;
  if (
    !handoff ||
    !UUID_PATTERN.test(handoff.installationId ?? "") ||
    !INITIAL_STATUSES.has(handoff.status) ||
    typeof handoff.handoffUrl !== "string"
  ) {
    throw new HandoffError("Portal returned an invalid handoff.");
  }

  let handoffUrl;
  try {
    handoffUrl = new URL(handoff.handoffUrl);
  } catch {
    throw new HandoffError("Portal returned an invalid handoff URL.");
  }
  if (handoffUrl.origin !== config.handoffOrigin) {
    throw new HandoffError(
      "Portal returned a handoff URL outside PORTAL_HANDOFF_ORIGIN.",
    );
  }

  return {
    installationId: handoff.installationId,
    status: handoff.status,
    // Preserve the exact literal returned by Portal. The redirect below must
    // not normalize, rebuild, or decode this customer-facing identifier.
    handoffUrl: handoff.handoffUrl,
    installationName: input.installationName,
  };
}
