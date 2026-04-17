import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  return NextResponse.json({ ok: true });
}
