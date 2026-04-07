import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getItemCounts, getLatestRun } from "@/lib/items";
import { getQueueCounts } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const [counts, latestRun, queue] = await Promise.all([getItemCounts(), getLatestRun(), getQueueCounts()]);
  return NextResponse.json({ counts, latestRun, queue });
}
