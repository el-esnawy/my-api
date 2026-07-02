"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMe, useSignOut } from "@/lib/client/hooks";
import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
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
    <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <Link href="/dashboard/schemas" className="flex items-center gap-2 font-semibold text-slate-900">
        <Logo />
        <span className="hidden sm:inline">{t("common.brand")}</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/docs"
          className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:inline-flex"
        >
          Docs
        </Link>
        {me && (
          <Link
            href="/dashboard/account/profile"
            className="hidden max-w-52 truncate text-sm text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-100 md:inline"
          >
            {me.email}
          </Link>
        )}
        <LanguageSwitcher />
        <ThemeToggle />
        <button
          onClick={onSignOut}
          disabled={signOut.isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {t("dashboard.signOut")}
        </button>
      </div>
    </div>
  );
}
