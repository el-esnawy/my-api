"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/atoms/logo";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation();

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <Logo />
        <span>{t("common.brand")}</span>
      </div>
      <nav className="flex items-center gap-1 sm:gap-2">
        <a
          href="#pricing"
          className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:inline-block"
        >
          {t("common.pricing")}
        </a>
        <LanguageSwitcher />
        {signedIn ? (
          <Link
            href="/dashboard/account/profile"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            {t("common.goToAccount")}
          </Link>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              {t("common.signIn")}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t("common.getStarted")}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
