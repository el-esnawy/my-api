"use client";

import { useTranslation } from "react-i18next";

const steps = [
  {
    n: "1",
    titleKey: "landing.howItWorks.steps.one.title",
    descriptionKey: "landing.howItWorks.steps.one.description",
  },
  {
    n: "2",
    titleKey: "landing.howItWorks.steps.two.title",
    descriptionKey: "landing.howItWorks.steps.two.description",
  },
  {
    n: "3",
    titleKey: "landing.howItWorks.steps.three.title",
    descriptionKey: "landing.howItWorks.steps.three.description",
  },
  {
    n: "4",
    titleKey: "landing.howItWorks.steps.four.title",
    descriptionKey: "landing.howItWorks.steps.four.description",
  },
];

export function LandingHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="border-y border-slate-200/70 bg-white/60 py-16 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            {t("landing.howItWorks.title")}
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-bold text-slate-900 sm:text-3xl">
            From schema to public API in four deliberate steps.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Each step leaves a visible artifact in the dashboard, so your team can audit
          what exists, who can call it, and which fields are exposed.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-500/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white dark:bg-indigo-500">
              {s.n}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{t(s.titleKey)}</h3>
            <p className="mt-1 text-sm text-slate-600">{t(s.descriptionKey)}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
