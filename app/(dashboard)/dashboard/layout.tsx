"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMe, useSignOut } from "@/lib/client/hooks";
import { cn } from "@/components/ui";

const tabs = [
  { href: "/dashboard/schemas", label: "Schemas" },
  { href: "/dashboard/endpoints", label: "Endpoints" },
  { href: "/dashboard/tokens", label: "Access Tokens" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const signOut = useSignOut();

  async function onSignOut() {
    await signOut.mutateAsync();
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard/schemas" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
                <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span>my-api</span>
          </Link>
          <div className="flex items-center gap-4">
            {me && <span className="hidden text-sm text-slate-500 sm:inline">{me.email}</span>}
            <button
              onClick={onSignOut}
              disabled={signOut.isPending}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto flex max-w-6xl gap-1 px-4">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative px-4 py-3 text-sm font-medium transition",
                  active
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
