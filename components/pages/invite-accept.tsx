import Link from "next/link";
import { Logo } from "@/components/atoms/logo";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { getServerTranslator } from "@/i18n/server";
import { InviteAcceptForm } from "@/components/sections/auth/invite-accept-form";

/**
 * Deliberately NOT under app/(auth) — that route group redirects any
 * signed-in visitor straight to the dashboard, but an invitee who already
 * has an account needs to view (and accept) this page while signed in.
 */
export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getServerTranslator();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <Logo />
          <span>{t("common.brand")}</span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <InviteAcceptForm token={token} />
        </div>
      </main>
    </div>
  );
}
