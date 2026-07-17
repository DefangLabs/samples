import { recordError } from "@/lib/report-error";

// Intake for client-side errors (window errors, unhandled rejections, React
// error boundaries). Unauthenticated on purpose — anyone hitting a broken page
// should be able to get the error into the backlog. recordError dedupes and
// caps length to prevent flooding.
export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    message?: unknown;
    url?: unknown;
  } | null;

  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  if (!message) {
    return Response.json({ error: "message required" }, { status: 400 });
  }
  const url = typeof payload?.url === "string" ? payload.url.slice(0, 300) : "";

  await recordError(`Client error: ${message.slice(0, 500)}`, url ? `at ${url}` : undefined);
  return Response.json({ ok: true }, { status: 201 });
}
