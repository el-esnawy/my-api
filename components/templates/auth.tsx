import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Logo } from "@/components/atoms/logo";

export default async function AuthTemplate({ children }: { children: React.ReactNode }) {
  // Already signed in? The auth pages aren't for you — go to the dashboard.
  const session = await getSession();
  if (session) redirect("/dashboard/schemas");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-50">
      <header className="mx-auto w-full max-w-6xl px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <Logo />
          <span>my-api</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
