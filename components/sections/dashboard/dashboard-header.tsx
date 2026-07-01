"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMe, useSignOut } from "@/lib/client/hooks";
import { Logo } from "@/components/atoms/logo";

export function DashboardHeader() {
  const router = useRouter();
  const { data: me } = useMe();
  const signOut = useSignOut();

  async function onSignOut() {
    await signOut.mutateAsync();
    router.replace("/sign-in");
  }

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
      <Link href="/dashboard/schemas" className="flex items-center gap-2 font-semibold text-slate-900">
        <Logo />
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
  );
}
