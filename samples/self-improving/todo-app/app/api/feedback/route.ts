import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Sign in to send feedback." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  if (body.length < 3 || body.length > 2000) {
    return Response.json(
      { error: "Feedback must be between 3 and 2,000 characters." },
      { status: 400 },
    );
  }

  await query(
    'INSERT INTO "feedback" ("id", "user_id", "body") VALUES ($1, $2, $3)',
    [randomUUID(), session.user.id, body],
  );

  return Response.json({ ok: true }, { status: 201 });
}
