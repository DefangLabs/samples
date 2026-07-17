import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var todoDatabasePool: Pool | undefined;
  var todoSchemaPromise: Promise<void> | undefined;
}

// sslmode in DATABASE_URL is the single source of TLS truth: `disable` local,
// `no-verify` for managed DBs (Cloud SQL internal CA); pg derives ssl from it.
// `sslmode=require` is avoided because pg 8.22+ treats it as verify-full and
// rejects Cloud SQL's cert (UNABLE_TO_VERIFY_LEAF_SIGNATURE).
const connectionString = process.env.DATABASE_URL;

export const pool =
  global.todoDatabasePool ?? new Pool({ connectionString });

global.todoDatabasePool = pool;

export async function ensureSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set before using the application database.");
  }

  if (!global.todoSchemaPromise) {
    global.todoSchemaPromise = readFile(
      path.join(process.cwd(), "lib", "schema.sql"),
      "utf8",
    )
      .then(async (schema) => {
        // Serialize schema init across services (app + dev share the DB):
        // concurrent CREATE TABLE IF NOT EXISTS on a fresh database races on
        // the implicit row-type insert (duplicate pg_type_typname_nsp_index).
        const client = await pool.connect();
        try {
          await client.query("SELECT pg_advisory_lock(823001)");
          await client.query(schema);
          await client.query("SELECT pg_advisory_unlock(823001)");
        } finally {
          client.release();
        }
      })
      .catch((error) => {
        global.todoSchemaPromise = undefined;
        throw error;
      });
  }

  await global.todoSchemaPromise;
}

export async function query<Row extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
  await ensureSchema();
  return pool.query<Row>(text, [...values]);
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
