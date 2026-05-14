import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ['.env.local', '.env'] });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config; 