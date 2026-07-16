import { betterAuth } from "better-auth";
import { ensureSchema, pool } from "@/lib/db";

// Next imports route modules while constructing the production bundle. Runtime
// entrypoints still call ensureAuthReady(), which rejects this build-only value.
const secret = process.env.BETTER_AUTH_SECRET ?? "build-only-secret-not-valid-at-runtime";

export const auth = betterAuth({
  database: pool,
  secret,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          await ensureSchema();
          const existing = await pool.query('SELECT 1 FROM "user" LIMIT 1');
          return {
            data: {
              ...user,
              role: existing.rowCount === 0 ? "admin" : "user",
            },
          };
        },
      },
    },
  },
});

export async function ensureAuthReady(): Promise<void> {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET must be set before using authentication.");
  }
  await ensureSchema();
}

export type AppSession = typeof auth.$Infer.Session;
