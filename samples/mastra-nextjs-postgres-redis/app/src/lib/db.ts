import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!global.pgPool) {
    global.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return global.pgPool;
}

export async function ensureSchema() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      summary TEXT,
      error TEXT,
      profile TEXT,
      scale_factor INTEGER,
      duration_seconds INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id BIGSERIAL PRIMARY KEY,
      external_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      owner TEXT NOT NULL,
      summary TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'support-hub',
      customer TEXT,
      sync_job_id TEXT REFERENCES sync_jobs(id) ON DELETE SET NULL,
      ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activities (
      id BIGSERIAL PRIMARY KEY,
      external_id TEXT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'event-stream',
      customer TEXT,
      sync_job_id TEXT REFERENCES sync_jobs(id) ON DELETE SET NULL,
      ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      occurred_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS triage_events (
      id BIGSERIAL PRIMARY KEY,
      sync_job_id TEXT REFERENCES sync_jobs(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_external_id TEXT NOT NULL,
      category TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      sentiment TEXT NOT NULL,
      priority TEXT NOT NULL,
      tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      recommended_action TEXT NOT NULL,
      rationale TEXT NOT NULL,
      search_summary TEXT NOT NULL,
      embedding JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (entity_type, entity_external_id)
    );

    ALTER TABLE sync_jobs ADD COLUMN IF NOT EXISTS profile TEXT;
    ALTER TABLE sync_jobs ADD COLUMN IF NOT EXISTS scale_factor INTEGER;
    ALTER TABLE sync_jobs ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'support-hub';
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS customer TEXT;
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sync_job_id TEXT REFERENCES sync_jobs(id) ON DELETE SET NULL;
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    ALTER TABLE activities ADD COLUMN IF NOT EXISTS external_id TEXT;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'event-stream';
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS customer TEXT;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS sync_job_id TEXT REFERENCES sync_jobs(id) ON DELETE SET NULL;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    UPDATE activities
    SET external_id = CONCAT('ACT-LEGACY-', id)
    WHERE external_id IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS activities_external_id_key ON activities (external_id);
    CREATE INDEX IF NOT EXISTS tickets_sync_job_id_idx ON tickets (sync_job_id);
    CREATE INDEX IF NOT EXISTS activities_sync_job_id_idx ON activities (sync_job_id);
    CREATE INDEX IF NOT EXISTS triage_events_sync_job_id_idx ON triage_events (sync_job_id);
    CREATE INDEX IF NOT EXISTS triage_events_entity_idx ON triage_events (entity_type, entity_external_id);
  `);
}
