import { Pool } from "pg";

// The admin console is hosted in this server — deliberately outside the Next.js
// app that the coding agent edits — so it reads and writes Postgres directly
// instead of going through the app (which may be crashing). sslmode in
// DATABASE_URL is the single source of TLS truth (no-verify for managed PG);
// pg derives ssl from it.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
