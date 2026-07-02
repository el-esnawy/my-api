"use client";

import type { IconType } from "react-icons";
import { useTranslation } from "react-i18next";
import { SchemaIcon } from "@/components/atoms/icons/schema-icon";
import { EndpointIcon } from "@/components/atoms/icons/endpoint-icon";
import { TokenIcon } from "@/components/atoms/icons/token-icon";

const features: Array<{ titleKey: string; bodyKey: string; Icon: IconType }> = [
  {
    titleKey: "landing.features.define.title",
    bodyKey: "landing.features.define.body",
    Icon: SchemaIcon,
  },
  {
    titleKey: "landing.features.generate.title",
    bodyKey: "landing.features.generate.body",
    Icon: EndpointIcon,
  },
  {
    titleKey: "landing.features.query.title",
    bodyKey: "landing.features.query.body",
    Icon: TokenIcon,
  },
];

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            Built for small teams that need real APIs quickly
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-bold text-slate-900 sm:text-3xl">
            Everything between a spreadsheet and a hand-rolled backend.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Keep the fast setup, add typed records, endpoint permissions, access tokens,
          and rate limits that are scoped to each organization.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.titleKey}
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-500/40 dark:hover:shadow-black/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:scale-105 dark:bg-indigo-500/15 dark:text-indigo-200">
              <f.Icon size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{t(f.titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(f.bodyKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
