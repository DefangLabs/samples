import { sampleDocuments } from "@/data/sampleData";
import {
  cosineSimilarity,
  embedTextForSearch,
  parseEmbedding,
  type GeneratedActivityEvent,
  type GeneratedInboundEvent,
  type GeneratedTicketEvent,
  type SimulationConfig,
  type TriageClassification,
} from "@/lib/ai";
import { getPool } from "@/lib/db";

export type DashboardSnapshot = {
  documentCount: number;
  taskCount: number;
  openTicketCount: number;
  activityCount: number;
  triagedCount: number;
  embeddingCount: number;
  latestJob: {
    id: string;
    status: string;
    progress: number;
    summary: string | null;
    error: string | null;
    profile: string | null;
    scaleFactor: number | null;
    durationSeconds: number | null;
    updatedAt: string;
  } | null;
};

export type OpenTicket = {
  externalId: string;
  title: string;
  status: string;
  priority: string;
  owner: string;
  summary: string;
  source: string;
  customer: string | null;
  tags: string[];
  category: string | null;
  riskScore: number | null;
  recommendedAction: string | null;
};

export type RecentActivity = {
  externalId: string;
  kind: string;
  title: string;
  body: string;
  source: string;
  customer: string | null;
  tags: string[];
  category: string | null;
  riskScore: number | null;
  occurredAt: string;
};

export type TriageInsight = {
  entityType: "ticket" | "activity";
  externalId: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  riskScore: number;
  tags: string[];
  recommendedAction: string;
  searchSummary: string;
  score: number;
};

export async function recordSyncJob(
  jobId: string,
  status: string,
  progress = 0,
  config?: Partial<Pick<SimulationConfig, "profile" | "scaleFactor" | "durationSeconds">>,
) {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO sync_jobs (id, status, progress, profile, scale_factor, duration_seconds)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE
      SET status = EXCLUDED.status,
          progress = EXCLUDED.progress,
          profile = COALESCE(EXCLUDED.profile, sync_jobs.profile),
          scale_factor = COALESCE(EXCLUDED.scale_factor, sync_jobs.scale_factor),
          duration_seconds = COALESCE(EXCLUDED.duration_seconds, sync_jobs.duration_seconds),
          updated_at = NOW()
    `,
    [jobId, status, progress, config?.profile ?? null, config?.scaleFactor ?? null, config?.durationSeconds ?? null],
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
      SET status = CASE
            WHEN status IN ('queued', 'running') THEN 'running'
            ELSE status
          END,
          progress = $2,
          summary = $3,
          updated_at = NOW()
      WHERE id = $1
    `,
    [jobId, progress, summary],
  );
}

export async function resetWorkspaceForSimulation() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM triage_events");
    await client.query("DELETE FROM tickets");
    await client.query("DELETE FROM activities");
    await client.query("DELETE FROM documents");

    for (const doc of sampleDocuments) {
      await client.query(
        `
          INSERT INTO documents (slug, title, category, content, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
        [doc.slug, doc.title, doc.category, doc.content],
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

export async function insertGeneratedTicket(event: GeneratedTicketEvent, syncJobId: string) {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO tickets (
        external_id,
        title,
        status,
        priority,
        owner,
        summary,
        source,
        customer,
        sync_job_id,
        ingested_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (external_id) DO UPDATE
      SET title = EXCLUDED.title,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          owner = EXCLUDED.owner,
          summary = EXCLUDED.summary,
          source = EXCLUDED.source,
          customer = EXCLUDED.customer,
          sync_job_id = EXCLUDED.sync_job_id,
          ingested_at = EXCLUDED.ingested_at,
          updated_at = NOW()
    `,
    [
      event.externalId,
      event.title,
      event.status,
      event.priority,
      event.owner,
      event.body,
      event.source,
      event.customer,
      syncJobId,
      event.occurredAt,
    ],
  );
}

export async function insertGeneratedActivity(event: GeneratedActivityEvent, syncJobId: string) {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO activities (
        external_id,
        kind,
        title,
        body,
        source,
        customer,
        sync_job_id,
        ingested_at,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (external_id) DO UPDATE
      SET kind = EXCLUDED.kind,
          title = EXCLUDED.title,
          body = EXCLUDED.body,
          source = EXCLUDED.source,
          customer = EXCLUDED.customer,
          sync_job_id = EXCLUDED.sync_job_id,
          ingested_at = EXCLUDED.ingested_at,
          occurred_at = EXCLUDED.occurred_at
    `,
    [
      event.externalId,
      event.kind,
      event.title,
      event.body,
      event.source,
      event.customer,
      syncJobId,
      event.occurredAt,
    ],
  );
}

export async function getEventForTriage(
  entityType: "ticket" | "activity",
  externalId: string,
): Promise<GeneratedInboundEvent | null> {
  const pool = getPool();

  if (entityType === "ticket") {
    const result = await pool.query(
      `
        SELECT external_id, source, customer, title, summary, owner, status, priority, ingested_at
        FROM tickets
        WHERE external_id = $1
        LIMIT 1
      `,
      [externalId],
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      eventType: "ticket",
      externalId: row.external_id as string,
      source: row.source as string,
      customer: (row.customer as string | null) ?? "Unknown",
      title: row.title as string,
      body: row.summary as string,
      owner: row.owner as string,
      status: row.status as GeneratedTicketEvent["status"],
      priority: row.priority as GeneratedTicketEvent["priority"],
      occurredAt: (row.ingested_at as Date).toISOString(),
    };
  }

  const result = await pool.query(
    `
      SELECT external_id, kind, source, customer, title, body, occurred_at
      FROM activities
      WHERE external_id = $1
      LIMIT 1
    `,
    [externalId],
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    eventType: "activity",
    externalId: row.external_id as string,
    source: row.source as string,
    customer: (row.customer as string | null) ?? "Unknown",
    title: row.title as string,
    body: row.body as string,
    kind: row.kind as GeneratedActivityEvent["kind"],
    occurredAt: (row.occurred_at as Date).toISOString(),
  };
}

export async function upsertTriageEvent(
  syncJobId: string,
  event: GeneratedInboundEvent,
  triage: TriageClassification,
  embedding: number[],
) {
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO triage_events (
        sync_job_id,
        entity_type,
        entity_external_id,
        category,
        risk_score,
        sentiment,
        priority,
        tags,
        recommended_action,
        rationale,
        search_summary,
        embedding,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::TEXT[], $9, $10, $11, $12::jsonb, NOW())
      ON CONFLICT (entity_type, entity_external_id) DO UPDATE
      SET sync_job_id = EXCLUDED.sync_job_id,
          category = EXCLUDED.category,
          risk_score = EXCLUDED.risk_score,
          sentiment = EXCLUDED.sentiment,
          priority = EXCLUDED.priority,
          tags = EXCLUDED.tags,
          recommended_action = EXCLUDED.recommended_action,
          rationale = EXCLUDED.rationale,
          search_summary = EXCLUDED.search_summary,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
    `,
    [
      syncJobId,
      event.eventType,
      event.externalId,
      triage.category,
      triage.riskScore,
      triage.sentiment,
      triage.priority,
      triage.tags,
      triage.recommendedAction,
      triage.rationale,
      triage.searchSummary,
      JSON.stringify(embedding),
    ],
  );

  if (event.eventType === "ticket") {
    await pool.query(
      `
        UPDATE tickets
        SET priority = $2,
            updated_at = NOW()
        WHERE external_id = $1
      `,
      [event.externalId, triage.priority],
    );
  }
}

export async function countGeneratedEventsForSync(jobId: string) {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT (
        (SELECT COUNT(*)::int FROM tickets WHERE sync_job_id = $1) +
        (SELECT COUNT(*)::int FROM activities WHERE sync_job_id = $1)
      )::int AS count
    `,
    [jobId],
  );

  return (result.rows[0]?.count as number | undefined) ?? 0;
}

export async function countTriagedEventsForSync(jobId: string) {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM triage_events
      WHERE sync_job_id = $1
    `,
    [jobId],
  );

  return (result.rows[0]?.count as number | undefined) ?? 0;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const pool = getPool();
  const [docResult, taskResult, openTicketResult, activityResult, triageResult, embeddingResult, jobResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM documents"),
    pool.query("SELECT COUNT(*)::int AS count FROM tickets"),
    pool.query("SELECT COUNT(*)::int AS count FROM tickets WHERE status != 'resolved'"),
    pool.query("SELECT COUNT(*)::int AS count FROM activities"),
    pool.query("SELECT COUNT(*)::int AS count FROM triage_events"),
    pool.query("SELECT COUNT(*)::int AS count FROM triage_events WHERE embedding IS NOT NULL"),
    pool.query(
      `
        SELECT id, status, progress, summary, error, profile, scale_factor, duration_seconds, updated_at
        FROM sync_jobs
        ORDER BY updated_at DESC
        LIMIT 1
      `,
    ),
  ]);

  return {
    documentCount: docResult.rows[0]?.count ?? 0,
    taskCount: taskResult.rows[0]?.count ?? 0,
    openTicketCount: openTicketResult.rows[0]?.count ?? 0,
    activityCount: activityResult.rows[0]?.count ?? 0,
    triagedCount: triageResult.rows[0]?.count ?? 0,
    embeddingCount: embeddingResult.rows[0]?.count ?? 0,
    latestJob: jobResult.rows[0]
      ? {
          id: jobResult.rows[0].id,
          status: jobResult.rows[0].status,
          progress: jobResult.rows[0].progress,
          summary: jobResult.rows[0].summary,
          error: jobResult.rows[0].error,
          profile: (jobResult.rows[0].profile as string | null) ?? null,
          scaleFactor: (jobResult.rows[0].scale_factor as number | null) ?? null,
          durationSeconds: (jobResult.rows[0].duration_seconds as number | null) ?? null,
          updatedAt: jobResult.rows[0].updated_at.toISOString(),
        }
      : null,
  };
}

export async function listRecentJobs() {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, status, progress, summary, error, profile, scale_factor, duration_seconds, updated_at
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
    profile: (row.profile as string | null) ?? null,
    scaleFactor: (row.scale_factor as number | null) ?? null,
    durationSeconds: (row.duration_seconds as number | null) ?? null,
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

export async function searchTriageInsights(query: string): Promise<TriageInsight[]> {
  const pool = getPool();
  const queryEmbedding = await embedTextForSearch(query);

  const result = await pool.query(
    `
      SELECT
        tr.entity_type,
        tr.entity_external_id,
        tr.category,
        tr.priority,
        tr.risk_score,
        tr.tags,
        tr.recommended_action,
        tr.search_summary,
        tr.embedding,
        COALESCE(t.title, a.title) AS title,
        COALESCE(t.summary, a.body) AS body
      FROM triage_events tr
      LEFT JOIN tickets t
        ON tr.entity_type = 'ticket'
       AND tr.entity_external_id = t.external_id
      LEFT JOIN activities a
        ON tr.entity_type = 'activity'
       AND tr.entity_external_id = a.external_id
      ORDER BY tr.updated_at DESC
      LIMIT 200
    `,
  );

  const semanticCandidates = result.rows
    .map((row) => {
      const embedding = parseEmbedding(row.embedding);
      if (!embedding) {
        return null;
      }

      return {
        entityType: row.entity_type as "ticket" | "activity",
        externalId: row.entity_external_id as string,
        title: (row.title as string | null) ?? "Untitled",
        body: (row.body as string | null) ?? "",
        category: row.category as string,
        priority: row.priority as string,
        riskScore: row.risk_score as number,
        tags: (row.tags as string[] | null) ?? [],
        recommendedAction: row.recommended_action as string,
        searchSummary: row.search_summary as string,
        score: cosineSimilarity(queryEmbedding, embedding),
      };
    })
    .filter((candidate): candidate is TriageInsight => Boolean(candidate))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (semanticCandidates.length > 0) {
    return semanticCandidates;
  }

  const fallbackTerm = `%${query.trim()}%`;
  const fallback = await pool.query(
    `
      SELECT
        tr.entity_type,
        tr.entity_external_id,
        tr.category,
        tr.priority,
        tr.risk_score,
        tr.tags,
        tr.recommended_action,
        tr.search_summary,
        COALESCE(t.title, a.title) AS title,
        COALESCE(t.summary, a.body) AS body
      FROM triage_events tr
      LEFT JOIN tickets t
        ON tr.entity_type = 'ticket'
       AND tr.entity_external_id = t.external_id
      LEFT JOIN activities a
        ON tr.entity_type = 'activity'
       AND tr.entity_external_id = a.external_id
      WHERE tr.search_summary ILIKE $1
         OR COALESCE(t.title, a.title) ILIKE $1
      ORDER BY tr.updated_at DESC
      LIMIT 5
    `,
    [fallbackTerm],
  );

  return fallback.rows.map((row) => ({
    entityType: row.entity_type as "ticket" | "activity",
    externalId: row.entity_external_id as string,
    title: (row.title as string | null) ?? "Untitled",
    body: (row.body as string | null) ?? "",
    category: row.category as string,
    priority: row.priority as string,
    riskScore: row.risk_score as number,
    tags: (row.tags as string[] | null) ?? [],
    recommendedAction: row.recommended_action as string,
    searchSummary: row.search_summary as string,
    score: 0,
  }));
}

export async function getOpenTickets(): Promise<OpenTicket[]> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT
        t.external_id,
        t.title,
        t.status,
        COALESCE(tr.priority, t.priority) AS priority,
        t.owner,
        t.summary,
        t.source,
        t.customer,
        tr.category,
        tr.risk_score,
        tr.recommended_action,
        COALESCE(tr.tags, ARRAY[]::TEXT[]) AS tags
      FROM tickets t
      LEFT JOIN triage_events tr
        ON tr.entity_type = 'ticket'
       AND tr.entity_external_id = t.external_id
      WHERE t.status != 'resolved'
      ORDER BY
        COALESCE(tr.risk_score, 0) DESC,
        CASE COALESCE(tr.priority, t.priority)
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        t.updated_at DESC
      LIMIT 12
    `,
  );

  return result.rows.map((row) => ({
    externalId: row.external_id as string,
    title: row.title as string,
    status: row.status as string,
    priority: row.priority as string,
    owner: row.owner as string,
    summary: row.summary as string,
    source: row.source as string,
    customer: (row.customer as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? [],
    category: (row.category as string | null) ?? null,
    riskScore: (row.risk_score as number | null) ?? null,
    recommendedAction: (row.recommended_action as string | null) ?? null,
  }));
}

export async function getRecentActivities(limit = 5): Promise<RecentActivity[]> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT
        a.external_id,
        a.kind,
        a.title,
        a.body,
        a.source,
        a.customer,
        a.occurred_at,
        tr.category,
        tr.risk_score,
        COALESCE(tr.tags, ARRAY[]::TEXT[]) AS tags
      FROM activities a
      LEFT JOIN triage_events tr
        ON tr.entity_type = 'activity'
       AND tr.entity_external_id = a.external_id
      ORDER BY a.occurred_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows.map((row) => ({
    externalId: row.external_id as string,
    kind: row.kind as string,
    title: row.title as string,
    body: row.body as string,
    source: row.source as string,
    customer: (row.customer as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? [],
    category: (row.category as string | null) ?? null,
    riskScore: (row.risk_score as number | null) ?? null,
    occurredAt: row.occurred_at.toISOString(),
  }));
}
