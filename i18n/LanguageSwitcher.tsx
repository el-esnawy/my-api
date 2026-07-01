"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  LANGUAGE_COOKIE,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./settings";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageSwitcher() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const current = i18n.language.split("-")[0] as Language;

  async function onChange(language: Language) {
    document.cookie = `${LANGUAGE_COOKIE}=${encodeURIComponent(
      language
    )}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    await i18n.changeLanguage(language);
    router.refresh();
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-500">
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value as Language)}
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        aria-label={t("common.language")}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {language === "en" ? t("common.english") : t("common.spanish")}
          </option>
        ))}
      </select>
    </label>
  );
}
