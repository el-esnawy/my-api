"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FiArrowRight, FiDatabase, FiLock, FiZap } from "react-icons/fi";

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.72))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70 dark:bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pt-16 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
          <FiZap size={13} />
          {t("landing.hero.eyebrow")}
        </span>
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold text-slate-950 sm:text-5xl lg:text-6xl">
          {t("landing.hero.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {t("landing.hero.description")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <Link
              href="/dashboard/schemas"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {t("common.goToAccount")}
              <FiArrowRight />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {t("landing.hero.primaryCta")}
                <FiArrowRight />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Read the docs
              </Link>
            </>
          )}
        </div>

        <HeroProductPreview code={t("landing.hero.code")} />
      </div>
    </section>
  );
}

function HeroProductPreview({ code }: { code: string }) {
  return (
    <div className="animate-fade-up mx-auto mt-10 max-w-6xl text-left">
      <div className="animate-float-slow overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-black/30">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
            <span>Schema</span>
            <FiArrowRight size={13} />
            <span>Endpoint</span>
            <FiArrowRight size={13} />
            <span>Token</span>
            <FiArrowRight size={13} />
            <span>Live API</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            200 OK
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <PreviewStep
                icon={<FiDatabase />}
                title="Define a schema"
                body="Notes: title, body, done, dueAt"
                accent="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200"
              />
              <PreviewStep
                icon={<FiZap />}
                title="Expose endpoints"
                body="GET, POST, PUT, PATCH, DELETE"
                accent="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
              />
              <PreviewStep
                icon={<FiLock />}
                title="Scope request tokens"
                body="Read/write grants per endpoint"
                accent="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
              />
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-400">Record shape</p>
                <span className="text-xs text-slate-400">validated</span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  ["title", "string", "required"],
                  ["done", "boolean", "optional"],
                  ["dueAt", "date", "optional"],
                ].map(([name, type, state]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm dark:bg-slate-950"
                  >
                    <span className="font-mono text-slate-700">{name}</span>
                    <span className="text-xs text-slate-500">{type} · {state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Live request
              </span>
              <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                curl
              </span>
            </div>
            <pre className="scroll-thin overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-100">
              <code>{code}</code>
            </pre>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Latency", "38ms"],
                ["Quota", "9,942 left"],
                ["Token", "scoped"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold text-slate-100">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStep({
  icon,
  title,
  body,
  accent,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-500/40">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}
