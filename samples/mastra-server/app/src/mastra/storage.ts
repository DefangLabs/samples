/**
 * Durable state: threads, messages, traces, and workflow state.
 *
 * `x-defang-postgres: true` in compose.yaml makes Defang provision a managed
 * database and inject the connection details, so nothing here is cloud-specific.
 */

import { PostgresStore } from "@mastra/pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

export const storage = new PostgresStore({ id: "mastra-pg", connectionString });
