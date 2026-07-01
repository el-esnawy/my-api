import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export { default } from "@/components/templates/root";
