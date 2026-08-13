"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            name: String(form.get("name") ?? "").trim(),
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Authentication failed. Please try again.");
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const signingUp = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
          Self-Improving Todo
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {signingUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-slate-500">
          {signingUp
            ? "The first person to sign up becomes this app’s administrator."
            : "Sign in to get back to your list."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {signingUp ? (
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>
          ) : null}
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              name="password"
              type="password"
              autoComplete={signingUp ? "new-password" : "current-password"}
              minLength={8}
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Please wait…" : signingUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {signingUp ? "Already have an account?" : "New here?"}{" "}
          <Link
            href={signingUp ? "/login" : "/signup"}
            className="font-bold text-violet-700 hover:text-violet-900"
          >
            {signingUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
