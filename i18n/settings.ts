import en from "./en.json";
import es from "./es.json";

export const LANGUAGE_COOKIE = "my_api_language";
export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "es"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type Translator = (key: string, options?: Record<string, unknown>) => string;

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

export function normalizeLanguage(value?: string | null): Language {
  const code = value?.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code as Language)
    ? (code as Language)
    : DEFAULT_LANGUAGE;
}

export function readLanguageFromCookieHeader(cookieHeader: string | null): Language {
  if (!cookieHeader) return DEFAULT_LANGUAGE;
  const pairs = cookieHeader.split(";").map((part) => part.trim());
  const match = pairs.find((part) => part.startsWith(`${LANGUAGE_COOKIE}=`));
  if (!match) return DEFAULT_LANGUAGE;
  return normalizeLanguage(decodeURIComponent(match.slice(LANGUAGE_COOKIE.length + 1)));
}
