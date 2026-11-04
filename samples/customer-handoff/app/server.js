import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createInstallationHandoff,
  HandoffError,
  readConfig,
} from "./portal-client.js";

const publicDirectory = fileURLToPath(new URL("./public", import.meta.url));
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
};

function securityHeaders(contentType) {
  return {
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "content-type": contentType,
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sendError(response, status, message) {
  response.writeHead(status, securityHeaders("text/html; charset=utf-8"));
  response.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Handoff failed</title><link rel="stylesheet" href="/styles.css"></head>
<body><main class="shell"><section class="panel error-page"><p class="section-label">Handoff not created</p><h1>Check the request and try again</h1><p>${escapeHtml(message)}</p><a class="button secondary" href="/">Back to the sample</a></section></main></body></html>`);
}

async function readForm(request) {
  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    throw new HandoffError("Submit the handoff form to continue.", 415);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16 * 1024) {
      throw new HandoffError("The handoff request is too large.", 413);
    }
    chunks.push(chunk);
  }
  const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  return {
    customerEmail: form.get("customerEmail"),
    externalReference: form.get("externalReference"),
  };
}

async function serveStatic(pathname, response) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(relativePath)) return false;

  const filePath = join(publicDirectory, relativePath);
  if (!filePath.startsWith(`${publicDirectory}/`)) return false;
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) return false;

  response.writeHead(
    200,
    securityHeaders(
      contentTypes[extname(filePath)] ?? "application/octet-stream",
    ),
  );
  createReadStream(filePath).pipe(response);
  return true;
}

export function createAppServer({
  config,
  fetchImpl = fetch,
  logger = console,
} = {}) {
  const resolvedConfig = config ?? readConfig();
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        response.writeHead(
          200,
          securityHeaders("application/json; charset=utf-8"),
        );
        return response.end(JSON.stringify({ status: "ok" }));
      }

      if (request.method === "POST" && url.pathname === "/handoff") {
        // This route represents the trusted boundary after the developer's own
        // signup/payment/entitlement check. Payment data is never sent to Defang.
        const event = await readForm(request);
        const handoff = await createInstallationHandoff({
          config: resolvedConfig,
          event,
          fetchImpl,
        });
        logger.info(
          JSON.stringify({
            level: "info",
            message: "Installation handoff created or reused",
            installationId: handoff.installationId,
            installationName: handoff.installationName,
            status: handoff.status,
          }),
        );
        response.writeHead(303, {
          "cache-control": "no-store",
          location: handoff.handoffUrl,
          "referrer-policy": "no-referrer",
        });
        return response.end();
      }

      if (
        request.method === "GET" &&
        (await serveStatic(url.pathname, response))
      ) {
        return;
      }

      sendError(response, 404, "Page not found.");
    } catch (error) {
      const status = error instanceof HandoffError ? error.status : 500;
      const message =
        error instanceof HandoffError
          ? error.message
          : "The handoff could not be created. Check the server logs and retry.";
      if (!(error instanceof HandoffError)) {
        logger.error("Unexpected handoff error", error);
      }
      sendError(response, status, message);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const port = Number.parseInt(process.env.PORT ?? "8080", 10);
    createAppServer().listen(port, "0.0.0.0", () => {
      console.info(`Customer handoff sample listening on port ${port}`);
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid configuration";
    console.error(`Customer handoff sample could not start: ${message}`);
    process.exitCode = 1;
  }
}
