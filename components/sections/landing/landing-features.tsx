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
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.titleKey}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
