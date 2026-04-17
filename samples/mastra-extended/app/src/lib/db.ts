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

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = migrateSchema();
  }
  return schemaReady;
}

async function migrateSchema() {
  const pool = getPool();

  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS seed_runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      total_items INTEGER NOT NULL DEFAULT 20,
      processed_items INTEGER NOT NULL DEFAULT 0,
      summary TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS items (
      id BIGSERIAL PRIMARY KEY,
      run_id TEXT REFERENCES seed_runs(id) ON DELETE SET NULL,
      item_type TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT,
      assignee TEXT,
      category TEXT,
      priority TEXT,
      tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      embedding vector,
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT items_item_type_check CHECK (item_type IN ('task', 'event'))
    );

    CREATE INDEX IF NOT EXISTS items_item_type_created_idx ON items (item_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS items_run_id_idx ON items (run_id);
  `);
}
