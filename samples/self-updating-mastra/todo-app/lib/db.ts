import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var todoDatabasePool: Pool | undefined;
  var todoSchemaPromise: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL;

export const pool =
  global.todoDatabasePool ??
  new Pool({
    connectionString,
    ssl: connectionString?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

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
        await pool.query(schema);
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
