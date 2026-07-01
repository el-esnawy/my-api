"use client";

import { useTranslation } from "react-i18next";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-slate-200 py-8">
      <div className="mx-auto max-w-6xl px-6 text-sm text-slate-500">
        {t("landing.footer")}
      </div>
    </footer>
  );
}
