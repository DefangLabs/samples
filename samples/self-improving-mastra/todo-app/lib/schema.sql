CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "role" text NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "session_user_id_idx"
  ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "account_user_id_idx"
  ON "account" ("userId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
  ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "todos" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "completed" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "todos_user_created_idx"
  ON "todos" ("user_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "feedback" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'new',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "feedback_created_idx"
  ON "feedback" ("created_at" DESC);

-- Feedback also carries auto-captured errors (client + server), which have no
-- submitting user. `source` distinguishes 'user' feedback from 'error' reports.
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'user';
ALTER TABLE "feedback" ALTER COLUMN "user_id" DROP NOT NULL;
