import { getPool } from "@/lib/db";

export type ItemType = "task" | "event";

export type SeedRun = {
  id: string;
  status: string;
  totalItems: number;
  processedItems: number;
  summary: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemRecord = {
  id: number;
  runId: string | null;
  itemType: ItemType;
  source: string;
  title: string;
  body: string;
  status: string | null;
  assignee: string | null;
  category: string | null;
  priority: string | null;
  tags: string[];
  embedding: number[] | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RawItemSeed = {
  itemType: ItemType;
  source: string;
  title: string;
  body: string;
  status?: string | null;
  assignee?: string | null;
};

export type ItemClassification = {
  category: string;
  priority: string;
  tags: string[];
};

export type ItemFilters = {
  status?: string;
  assignee?: string;
  source?: string;
  category?: string;
  priority?: string;
  tag?: string;
  query?: string;
};

function mapRun(row: Record<string, unknown>): SeedRun {
  return {
    id: String(row.id),
    status: String(row.status),
    totalItems: Number(row.total_items),
    processedItems: Number(row.processed_items),
    summary: typeof row.summary === "string" ? row.summary : null,
    error: typeof row.error === "string" ? row.error : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapItem(row: Record<string, unknown>): ItemRecord {
  return {
    id: Number(row.id),
    runId: typeof row.run_id === "string" ? row.run_id : null,
    itemType: row.item_type === "event" ? "event" : "task",
    source: String(row.source),
    title: String(row.title),
    body: String(row.body),
    status: typeof row.status === "string" ? row.status : null,
    assignee: typeof row.assignee === "string" ? row.assignee : null,
    category: typeof row.category === "string" ? row.category : null,
    priority: typeof row.priority === "string" ? row.priority : null,
    tags: Array.isArray(row.tags) ? row.tags.filter((value): value is string => typeof value === "string") : [],
    embedding: null,
    processedAt: typeof row.processed_at === "string" ? row.processed_at : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function resetDemoState() {
  const pool = getPool();
  await pool.query("TRUNCATE TABLE items RESTART IDENTITY CASCADE");
  await pool.query("DELETE FROM seed_runs");
}

export async function createSeedRun(id: string, totalItems = 20) {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO seed_runs (id, status, total_items, processed_items, summary, error)
      VALUES ($1, 'queued', $2, 0, 'Queued item generation job', NULL)
    `,
    [id, totalItems],
  );
}

export async function setSeedRunTotal(id: string, totalItems: number) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE seed_runs
      SET total_items = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [id, totalItems],
  );
}

export async function startSeedRun(id: string, summary: string) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE seed_runs
      SET status = 'running', summary = $2, error = NULL, updated_at = NOW()
      WHERE id = $1
    `,
    [id, summary],
  );
}

export async function finishSeedRun(id: string, summary: string) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE seed_runs
      SET status = 'completed', summary = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [id, summary],
  );
}

export async function failSeedRun(id: string, error: string) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE seed_runs
      SET status = 'failed', error = $2, summary = 'Background processing failed', updated_at = NOW()
      WHERE id = $1
    `,
    [id, error],
  );
}

export async function getLatestRun() {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT *
      FROM seed_runs
      ORDER BY created_at DESC
      LIMIT 1
    `,
  );

  return result.rows[0] ? mapRun(result.rows[0]) : null;
}

export async function insertSeedItems(runId: string, items: RawItemSeed[]) {
  const pool = getPool();
  const inserted: ItemRecord[] = [];

  for (const item of items) {
    const result = await pool.query(
      `
        INSERT INTO items (
          run_id,
          item_type,
          source,
          title,
          body,
          status,
          assignee,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `,
      [runId, item.itemType, item.source, item.title, item.body, item.status ?? null, item.assignee ?? null],
    );

    inserted.push(mapItem(result.rows[0]));
  }

  return inserted;
}

export async function getItemById(id: number) {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
  return result.rows[0] ? mapItem(result.rows[0]) : null;
}

export async function updateProcessedItem(id: number, classification: ItemClassification, embedding: number[]) {
  const pool = getPool();
  const vectorLiteral = `[${embedding.join(",")}]`;
  const result = await pool.query(
    `
      UPDATE items
      SET
        category = $2,
        priority = $3,
        tags = $4,
        embedding = $5::vector,
        processed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, classification.category, classification.priority, classification.tags, vectorLiteral],
  );

  return result.rows[0] ? mapItem(result.rows[0]) : null;
}

export async function markItemProcessed(runId: string) {
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE seed_runs
      SET processed_items = processed_items + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [runId],
  );

  return result.rows[0] ? mapRun(result.rows[0]) : null;
}

/** Builds WHERE clauses from item filters. Appends to any existing clauses/values. */
function applyFilters(
  clauses: string[],
  values: unknown[],
  filters: ItemFilters = {},
) {
  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.status) clauses.push(`LOWER(status) = LOWER(${addValue(filters.status)})`);
  if (filters.assignee) clauses.push(`assignee ILIKE ${addValue(`%${filters.assignee}%`)}`);
  if (filters.source) clauses.push(`source ILIKE ${addValue(`%${filters.source}%`)}`);
  if (filters.category) clauses.push(`LOWER(category) = LOWER(${addValue(filters.category)})`);
  if (filters.priority) clauses.push(`LOWER(priority) = LOWER(${addValue(filters.priority)})`);
  if (filters.tag) clauses.push(`EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE LOWER(tag) = LOWER(${addValue(filters.tag)}))`);

  if (filters.query) {
    const query = addValue(`%${filters.query}%`);
    clauses.push(`(
      title ILIKE ${query}
      OR body ILIKE ${query}
      OR source ILIKE ${query}
      OR category ILIKE ${query}
      OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE ${query})
    )`);
  }
}

export async function getItemsByType(itemType: ItemType, limit = 10, filters: ItemFilters = {}) {
  const pool = getPool();
  const clauses = ["item_type = $1"];
  const values: unknown[] = [itemType];
  applyFilters(clauses, values, filters);
  values.push(limit);

  const result = await pool.query(
    `
      SELECT *
      FROM items
      WHERE ${clauses.join(" AND ")}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length}
    `,
    values,
  );

  return result.rows.map(mapItem);
}

export async function getItemCounts() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE item_type = 'task')::int AS task_count,
      COUNT(*) FILTER (WHERE item_type = 'event')::int AS event_count,
      COUNT(*) FILTER (WHERE processed_at IS NOT NULL)::int AS classified_count
    FROM items
  `);

  const row = result.rows[0] ?? {};
  return {
    taskCount: Number(row.task_count ?? 0),
    eventCount: Number(row.event_count ?? 0),
    classifiedCount: Number(row.classified_count ?? 0),
  };
}

export async function getAvailableTags(type?: ItemType) {
  const pool = getPool();
  const values: unknown[] = [];
  const typeClause = type ? `WHERE item_type = $1` : "";
  if (type) {
    values.push(type);
  }

  const result = await pool.query(
    `
      SELECT tag, COUNT(*)::int AS count
      FROM items
      CROSS JOIN LATERAL unnest(tags) AS tag
      ${typeClause}
      GROUP BY tag
      ORDER BY count DESC, tag ASC
    `,
    values,
  );

  return result.rows.map((row) => ({
    tag: String(row.tag),
    count: Number(row.count),
  }));
}

/** Finds the most similar items using pgvector cosine distance. */
export async function searchItemsByEmbedding(
  embedding: number[],
  type?: ItemType,
  limit = 5,
  filters: ItemFilters = {},
) {
  const pool = getPool();
  const vectorLiteral = `[${embedding.join(",")}]`;
  const clauses = ["processed_at IS NOT NULL", "embedding IS NOT NULL"];
  const values: unknown[] = [vectorLiteral, limit];

  if (type) {
    values.push(type);
    clauses.push(`item_type = $${values.length}`);
  }

  applyFilters(clauses, values, filters);

  const result = await pool.query(
    `
      SELECT *, 1 - (embedding <=> $1::vector) AS score
      FROM items
      WHERE ${clauses.join(" AND ")}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
    values,
  );

  return result.rows.map((row) => ({
    item: mapItem(row),
    score: Number(Number(row.score).toFixed(4)),
  }));
}
