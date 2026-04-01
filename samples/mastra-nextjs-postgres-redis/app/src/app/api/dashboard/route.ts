import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getDashboardSnapshot } from "@/lib/domain";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json({ snapshot });
}
