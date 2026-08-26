/**
 * Durable state.
 *
 * The Mastra server keeps threads, messages, traces, and workflow state here.
 * Anything that must survive a restart or be shared between replicas belongs
 * in Postgres, not in the container.
 *
 * `x-defang-postgres: true` in compose.yaml makes Defang provision a managed
 * database (RDS on AWS, Cloud SQL on GCP, Azure Database for PostgreSQL) and
 * inject the connection details, so this file needs no provider-specific code.
 */

import { PostgresStore } from "@mastra/pg";

let store: PostgresStore | undefined;

export function getStorage(): PostgresStore {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  store ??= new PostgresStore({ id: "mastra-pg", connectionString });
  return store;
}
