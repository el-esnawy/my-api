"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMe, useSignOut } from "@/lib/client/hooks";
import { Logo } from "@/components/atoms/logo";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

export function DashboardHeader() {
  const router = useRouter();
  const { t } = useTranslation();
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
        <span>{t("common.brand")}</span>
      </Link>
      <div className="flex items-center gap-4">
        {me && (
          <Link
            href="/dashboard/account/profile"
            className="hidden text-sm text-slate-500 transition hover:text-slate-800 sm:inline"
          >
            {me.email}
          </Link>
        )}
        <LanguageSwitcher />
        <button
          onClick={onSignOut}
          disabled={signOut.isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {t("dashboard.signOut")}
        </button>
      </div>
    </div>
  );
}
