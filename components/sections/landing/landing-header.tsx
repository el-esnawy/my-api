"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Logo />
          <span className="hidden sm:inline">{t("common.brand")}</span>
        </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/docs"
          className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:inline-block"
        >
          Docs
        </Link>
        <a
          href="#pricing"
          className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-block"
        >
          {t("common.pricing")}
        </a>
        <LanguageSwitcher />
        <ThemeToggle />
        {signedIn ? (
          <Link
            href="/dashboard/account/profile"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {t("common.goToAccount")}
          </Link>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-block"
            >
              {t("common.signIn")}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {t("common.getStarted")}
            </Link>
          </>
        )}
      </nav>
      </div>
    </header>
  );
}
