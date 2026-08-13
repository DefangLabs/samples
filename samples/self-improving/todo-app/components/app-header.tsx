"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface AppHeaderProps {
  email: string;
  showAdmin: boolean;
}

export function AppHeader({ email, showAdmin }: AppHeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-950">
          Todo <span className="font-normal text-slate-500">— a self-improving app</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {showAdmin ? (
            <Link
              href="/admin"
              className="rounded-full bg-violet-100 px-3 py-1.5 font-semibold text-violet-700 transition hover:bg-violet-200"
            >
              Admin
            </Link>
          ) : null}
          <span className="hidden text-slate-500 sm:inline">{email}</span>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="font-semibold text-slate-600 transition hover:text-slate-950 disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
