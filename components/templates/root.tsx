import * as React from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getServerLanguage } from "@/i18n/server";

export default async function RootTemplate({ children }: { children: React.ReactNode }) {
  const language = await getServerLanguage();

  return (
    <html lang={language}>
      <body className="min-h-screen antialiased">
        <I18nProvider initialLanguage={language}>
          <QueryProvider>{children}</QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
