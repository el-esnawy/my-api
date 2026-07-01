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
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2 className="text-center text-2xl font-bold text-slate-900">
        {t("landing.howItWorks.title")}
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {s.n}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{t(s.titleKey)}</h3>
            <p className="mt-1 text-sm text-slate-600">{t(s.descriptionKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
