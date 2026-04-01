import { getPool } from "@/lib/db";
import { sampleActivities, sampleDocuments, sampleTickets } from "@/data/sampleData";

export type DashboardSnapshot = {
  documentCount: number;
  openTicketCount: number;
  activityCount: number;
  latestJob: {
    id: string;
    status: string;
    progress: number;
    summary: string | null;
    error: string | null;
    updatedAt: string;
  } | null;
};

export async function recordSyncJob(jobId: string, status: string, progress = 0) {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO sync_jobs (id, status, progress)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET status = EXCLUDED.status,
          progress = EXCLUDED.progress,
          updated_at = NOW()
    `,
    [jobId, status, progress],
  );
}

export async function finishSyncJob(
  jobId: string,
  status: "completed" | "failed",
  summary: string | null,
  error: string | null,
) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE sync_jobs
      SET status = $2,
          progress = CASE WHEN $2 = 'completed' THEN 100 ELSE progress END,
          summary = $3,
          error = $4,
          updated_at = NOW()
      WHERE id = $1
    `,
    [jobId, status, summary, error],
  );
}

export async function updateSyncJobProgress(jobId: string, progress: number, summary: string) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE sync_jobs
      SET progress = $2,
          summary = $3,
          updated_at = NOW()
      WHERE id = $1
    `,
    [jobId, progress, summary],
  );
}

export async function seedWorkspaceData() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM documents");
    await client.query("DELETE FROM tickets");
    await client.query("DELETE FROM activities");

    for (const doc of sampleDocuments) {
      await client.query(
        `
          INSERT INTO documents (slug, title, category, content, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
        [doc.slug, doc.title, doc.category, doc.content],
      );
    }

    for (const ticket of sampleTickets) {
      await client.query(
        `
          INSERT INTO tickets (external_id, title, status, priority, owner, summary, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `,
        [ticket.externalId, ticket.title, ticket.status, ticket.priority, ticket.owner, ticket.summary],
      );
    }

    for (const activity of sampleActivities) {
      await client.query(
        `
          INSERT INTO activities (kind, title, body, occurred_at)
          VALUES ($1, $2, $3, $4)
        `,
        [activity.kind, activity.title, activity.body, activity.occurredAt],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const pool = getPool();
  const [docResult, ticketResult, activityResult, jobResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM documents"),
    pool.query("SELECT COUNT(*)::int AS count FROM tickets WHERE status != 'resolved'"),
    pool.query("SELECT COUNT(*)::int AS count FROM activities"),
    pool.query(
      `
        SELECT id, status, progress, summary, error, updated_at
        FROM sync_jobs
        ORDER BY updated_at DESC
        LIMIT 1
      `,
    ),
  ]);

  return {
    documentCount: docResult.rows[0]?.count ?? 0,
    openTicketCount: ticketResult.rows[0]?.count ?? 0,
    activityCount: activityResult.rows[0]?.count ?? 0,
    latestJob: jobResult.rows[0]
      ? {
          id: jobResult.rows[0].id,
          status: jobResult.rows[0].status,
          progress: jobResult.rows[0].progress,
          summary: jobResult.rows[0].summary,
          error: jobResult.rows[0].error,
          updatedAt: jobResult.rows[0].updated_at.toISOString(),
        }
      : null,
  };
}

export async function listRecentJobs() {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, status, progress, summary, error, updated_at
      FROM sync_jobs
      ORDER BY updated_at DESC
      LIMIT 10
    `,
  );

  return result.rows.map((row) => ({
    id: row.id as string,
    status: row.status as string,
    progress: row.progress as number,
    summary: row.summary as string | null,
    error: row.error as string | null,
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function searchDocuments(query: string) {
  const pool = getPool();
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
    .slice(0, 5);

  const fallbackTerm = query.trim();
  const searchTerms = terms.length > 0 ? terms : [fallbackTerm];
  const clauses = searchTerms.map((_, index) => `(title ILIKE $${index + 1} OR content ILIKE $${index + 1})`);
  const result = await pool.query(
    `
      SELECT title, category, content
      FROM documents
      WHERE ${clauses.join(" OR ")}
      ORDER BY updated_at DESC
      LIMIT 5
    `,
    searchTerms.map((term) => `%${term}%`),
  );

  return result.rows.map((row) => ({
    title: row.title as string,
    category: row.category as string,
    content: row.content as string,
  }));
}

export async function getOpenTickets() {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT external_id, title, status, priority, owner, summary
      FROM tickets
      WHERE status != 'resolved'
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        updated_at DESC
      LIMIT 10
    `,
  );

  return result.rows.map((row) => ({
    externalId: row.external_id as string,
    title: row.title as string,
    status: row.status as string,
    priority: row.priority as string,
    owner: row.owner as string,
    summary: row.summary as string,
  }));
}

export async function getRecentActivities(limit = 5) {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT kind, title, body, occurred_at
      FROM activities
      ORDER BY occurred_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows.map((row) => ({
    kind: row.kind as string,
    title: row.title as string,
    body: row.body as string,
    occurredAt: row.occurred_at.toISOString(),
  }));
}
