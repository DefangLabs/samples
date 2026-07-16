import { notFound } from "next/navigation";
import { AdminConsole, type FeedbackItem } from "@/components/admin-console";
import { AppHeader } from "@/components/app-header";
import { FeedbackBubble } from "@/components/feedback-bubble";
import { getAdminSession } from "@/lib/admin";
import { query } from "@/lib/db";

interface FeedbackRow {
  id: string;
  body: string;
  status: string;
  email: string;
  created_at: Date;
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) notFound();

  const result = await query<FeedbackRow>(
    'SELECT f."id", f."body", f."status", f."created_at", u."email" FROM "feedback" f JOIN "user" u ON u."id" = f."user_id" ORDER BY f."created_at" DESC',
  );
  const feedback: FeedbackItem[] = result.rows.map((item) => ({
    id: item.id,
    body: item.body,
    status: item.status,
    email: item.email,
    createdAt: item.created_at.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={session.user.email} showAdmin />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <AdminConsole feedback={feedback} />
      </main>
      <FeedbackBubble />
    </div>
  );
}
