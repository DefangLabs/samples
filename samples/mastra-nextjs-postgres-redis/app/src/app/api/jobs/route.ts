import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getOpenTickets, getRecentActivities, listRecentJobs } from "@/lib/domain";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const [jobs, tickets, activities] = await Promise.all([
    listRecentJobs(),
    getOpenTickets(),
    getRecentActivities(5),
  ]);

  return NextResponse.json({ jobs, tickets, activities });
}
