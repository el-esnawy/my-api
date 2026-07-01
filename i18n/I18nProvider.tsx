"use client";

import { useEffect, useRef } from "react";
import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  resources,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./settings";

function createClientI18n(language: Language): I18nInstance {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    resources,
    defaultNS: "translation",
    interpolation: { escapeValue: false },
  });
  return instance;
}

export function I18nProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const i18nRef = useRef<I18nInstance | null>(null);
  if (!i18nRef.current) {
    i18nRef.current = createClientI18n(initialLanguage);
  }

  useEffect(() => {
    if (i18nRef.current?.language !== initialLanguage) {
      i18nRef.current?.changeLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  return <I18nextProvider i18n={i18nRef.current}>{children}</I18nextProvider>;
}
