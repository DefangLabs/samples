"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

async function getUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user.id;
}

export async function addTodo(formData: FormData) {
  const userId = await getUserId();
  const title = String(formData.get("title") ?? "").trim();
  if (!title || title.length > 240) return;

  await query(
    'INSERT INTO "todos" ("id", "user_id", "title") VALUES ($1, $2, $3)',
    [randomUUID(), userId, title],
  );
  revalidatePath("/");
}

export async function toggleTodo(formData: FormData) {
  const userId = await getUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await query(
    'UPDATE "todos" SET "completed" = NOT "completed" WHERE "id" = $1 AND "user_id" = $2',
    [id, userId],
  );
  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const userId = await getUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await query('DELETE FROM "todos" WHERE "id" = $1 AND "user_id" = $2', [
    id,
    userId,
  ]);
  revalidatePath("/");
}
