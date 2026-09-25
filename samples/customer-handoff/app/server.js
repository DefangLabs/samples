import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createInstallationHandoff,
  getDemoContext,
  PortalRequestError,
} from "./portal-client.js";

const publicDirectory = fileURLToPath(new URL("./public", import.meta.url));
const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const graphqlUrl =
  process.env.PORTAL_GRAPHQL_URL ??
  "https://graphql.defang.io/v1/graphql";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) {
      throw new PortalRequestError("Request is too large.", 413);
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new PortalRequestError("Request must be valid JSON.", 400);
  }
}

function resolveToken(body) {
  const suppliedToken = typeof body?.token === "string" ? body.token.trim() : "";
  if (!suppliedToken || suppliedToken.length > 16_384) {
    throw new PortalRequestError(
      "Add a current developer access token to continue.",
      401,
    );
  }
  return suppliedToken;
}

async function serveStatic(pathname, response) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(relativePath)) return false;

  const filePath = join(publicDirectory, relativePath);
  if (!filePath.startsWith(`${publicDirectory}/`)) return false;
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) return false;

  response.writeHead(200, {
    "cache-control": relativePath === "index.html" ? "no-cache" : "public, max-age=3600",
    "content-security-policy":
      "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  });
  createReadStream(filePath).pipe(response);
  return true;
}

export function createAppServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, { status: "ok" });
      }

      if (request.method === "GET" && url.pathname === "/api/config") {
        return sendJson(response, 200, {
          portalHost: new URL(graphqlUrl).host,
        });
      }

      if (request.method === "POST" && url.pathname === "/api/context") {
        const body = await readJson(request);
        const context = await getDemoContext({
          graphqlUrl,
          token: resolveToken(body),
        });
        return sendJson(response, 200, context);
      }

      if (request.method === "POST" && url.pathname === "/api/handoffs") {
        const body = await readJson(request);
        const handoff = await createInstallationHandoff({
          graphqlUrl,
          token: resolveToken(body),
          input: body?.input,
        });
        return sendJson(response, 201, handoff);
      }

      if (request.method === "GET" && (await serveStatic(url.pathname, response))) {
        return;
      }

      sendJson(response, 404, { message: "Page not found." });
    } catch (error) {
      const status = error instanceof PortalRequestError ? error.status : 500;
      const message =
        error instanceof PortalRequestError
          ? error.message
          : "The demo could not complete the request. Try again.";
      sendJson(response, status, { message });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppServer().listen(port, "0.0.0.0", () => {
    console.log(`Programmatic handoff demo listening on port ${port}`);
  });
}
