"use client";

import { useTranslation } from "react-i18next";
import { AccountNav } from "@/components/sections/dashboard/account/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.tabs.account")}</h1>
      <div className="mt-4">
        <AccountNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
