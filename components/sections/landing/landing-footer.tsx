"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span>{t("landing.footer")}</span>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">
            Docs
          </Link>
          <Link href="/sign-up" className="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}
