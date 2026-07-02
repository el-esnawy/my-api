import * as React from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getServerLanguage } from "@/i18n/server";

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("my-api-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {}
})();
`;

export default async function RootTemplate({ children }: { children: React.ReactNode }) {
  const language = await getServerLanguage();

  return (
    <html lang={language} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <I18nProvider initialLanguage={language}>
          <QueryProvider>{children}</QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
