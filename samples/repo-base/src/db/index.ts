import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const client = new Pool({ connectionString: process.env.DB_URL! });

export const db = drizzle({ client });
