import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already signed in? The auth pages aren't for you — go to the dashboard.
  const session = await getSession();
  if (session) redirect("/dashboard/schemas");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-50">
      <header className="mx-auto w-full max-w-6xl px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
              <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span>my-api</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
