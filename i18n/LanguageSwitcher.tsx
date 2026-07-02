"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  LANGUAGE_LABELS,
  LANGUAGE_COOKIE,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./settings";
import { Select } from "@/components/atoms/select";

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
      <Select
        value={current}
        onChange={(e) => onChange(e.target.value as Language)}
        className="h-8 w-40 text-xs font-medium"
        aria-label={t("common.language")}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {LANGUAGE_LABELS[language]}
          </option>
        ))}
      </Select>
    </label>
  );
}
