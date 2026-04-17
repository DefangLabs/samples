import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getItemsByType } from "@/lib/items";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const [tasks, events] = await Promise.all([getItemsByType("task", 10), getItemsByType("event", 10)]);
  return NextResponse.json({ tasks, events });
}
