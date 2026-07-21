import { redirect } from "next/navigation";
import { addTodo, deleteTodo, toggleTodo } from "@/app/actions";
import { AppHeader } from "@/components/app-header";
import { FeedbackBubble } from "@/components/feedback-bubble";
import { query } from "@/lib/db";
import { getSession, isAdmin, isAdminUiEnabled } from "@/lib/session";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  const todos = await query<Todo>(
    'SELECT "id", "title", "completed" FROM "todos" WHERE "user_id" = $1 ORDER BY "created_at" DESC',
    [session.user.id],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        email={session.user.email}
        showAdmin={isAdminUiEnabled() && isAdmin(session)}
      />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            Your list
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            What needs doing?
          </h1>
          <p className="mt-2 text-slate-500">
            Keep it simple. If the app gets in your way, send feedback and it may rewrite itself.
          </p>
        </div>

        <form action={addTodo} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <input
            name="title"
            required
            maxLength={240}
            placeholder="Add a todo…"
            aria-label="New todo title"
            className="min-w-0 flex-1 rounded-xl px-3 py-2 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white transition hover:bg-violet-700"
          >
            Add
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {todos.rows.length ? (
            <ul className="divide-y divide-slate-100">
              {todos.rows.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                  <form action={toggleTodo}>
                    <input type="hidden" name="id" value={todo.id} />
                    <button
                      type="submit"
                      aria-label={
                        todo.completed
                          ? "Mark " + todo.title + " incomplete"
                          : "Complete " + todo.title
                      }
                      className={
                        "grid h-6 w-6 place-items-center rounded-full border-2 transition " +
                        (todo.completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 hover:border-violet-500")
                      }
                    >
                      {todo.completed ? "✓" : null}
                    </button>
                  </form>
                  <span
                    className={
                      "min-w-0 flex-1 break-words " +
                      (todo.completed ? "text-slate-400 line-through" : "text-slate-800")
                    }
                  >
                    {todo.title}
                  </span>
                  <form action={deleteTodo}>
                    <input type="hidden" name="id" value={todo.id} />
                    <button
                      type="submit"
                      aria-label={"Delete " + todo.title}
                      className="px-2 text-xl text-slate-300 transition hover:text-rose-500"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-700">Nothing here yet.</p>
              <p className="mt-1 text-sm text-slate-400">Add one small thing to get moving.</p>
            </div>
          )}
        </div>
      </main>
      <FeedbackBubble />
    </div>
  );
}
