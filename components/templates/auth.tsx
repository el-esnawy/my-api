import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { getServerTranslator } from "@/i18n/server";

export default async function AuthTemplate({ children }: { children: React.ReactNode }) {
  const t = await getServerTranslator();
  // Already signed in? The auth pages aren't for you — go to the dashboard.
  const session = await getSession();
  if (session) redirect("/dashboard/schemas");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <Logo />
          <span className="hidden sm:inline">{t("common.brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
