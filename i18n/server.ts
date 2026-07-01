import i18next from "i18next";
import { cookies } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  normalizeLanguage,
  readLanguageFromCookieHeader,
  resources,
  SUPPORTED_LANGUAGES,
  type Language,
  type Translator,
} from "./settings";

export async function getServerLanguage(): Promise<Language> {
  const store = await cookies();
  return normalizeLanguage(store.get(LANGUAGE_COOKIE)?.value);
}

export function getRequestLanguage(req: Request): Language {
  return readLanguageFromCookieHeader(req.headers.get("cookie"));
}

export async function createTranslator(language: Language): Promise<Translator> {
  const instance = i18next.createInstance();
  await instance.init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    resources,
    defaultNS: "translation",
    interpolation: { escapeValue: false },
  });
  return (key, options) => instance.t(key, options);
}

export async function getServerTranslator(): Promise<Translator> {
  return createTranslator(await getServerLanguage());
}

export async function getRequestTranslator(req: Request): Promise<Translator> {
  return createTranslator(getRequestLanguage(req));
}
