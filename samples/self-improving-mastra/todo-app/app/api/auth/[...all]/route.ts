import { toNextJsHandler } from "better-auth/next-js";
import { auth, ensureAuthReady } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  await ensureAuthReady();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  await ensureAuthReady();
  return handlers.POST(request);
}
