import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getDashboardSnapshot } from "@/lib/domain";
import { getQueueCounts } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const [snapshot, queue] = await Promise.all([getDashboardSnapshot(), getQueueCounts()]);
  return NextResponse.json({ snapshot, queue });
}
