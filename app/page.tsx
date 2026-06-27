import Link from "next/link";
import { getSession } from "@/lib/auth/session";

const features = [
  {
    title: "Define schemas",
    body: "Describe your data once — fields, types, required rules. No migrations, no boilerplate.",
    icon: "M4 7h16M4 12h16M4 17h10",
  },
  {
    title: "Generate REST endpoints",
    body: "Turn any schema into a real REST resource. Pick the verbs, choose what's readable and writable.",
    icon: "M3 12h18M12 3v18",
  },
  {
    title: "Query with access tokens",
    body: "Mint per-account tokens scoped to specific endpoints. Revoke any time. Strictly isolated per user.",
    icon: "M15 7a4 4 0 1 0-8 0v3H5v8h14v-8h-2V7Z",
  },
];

const steps = [
  { n: "1", t: "Create a schema", d: "e.g. a Note with title, body, done." },
  { n: "2", t: "Expose an endpoint", d: "/api/v1/notes with GET, POST, PUT, DELETE." },
  { n: "3", t: "Issue a token", d: "Scoped to that endpoint, read + write." },
  { n: "4", t: "Call it anywhere", d: "Authorization: Bearer <token>." },
];

const tiers = [
  {
    name: "Hobby",
    price: "$0",
    cadence: "/mo",
    tagline: "For side projects and trying things out.",
    features: [
      "3 schemas",
      "3 endpoints",
      "1 access token",
      "10k requests / month",
      "Community support",
    ],
    cta: { label: "Get started", href: "/sign-up" },
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/mo",
    tagline: "For production apps that need room to grow.",
    features: [
      "Unlimited schemas & endpoints",
      "10 access tokens",
      "1M requests / month",
      "Higher rate limits",
      "Email support",
    ],
    cta: { label: "Start free trial", href: "/sign-up" },
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    tagline: "For teams with scale, security, and SLA needs.",
    features: [
      "Unlimited everything",
      "SSO & audit logs",
      "Custom rate limits",
      "Dedicated support & SLA",
      "On-prem / VPC options",
    ],
    cta: { label: "Contact sales", href: "mailto:sales@example.com" },
    featured: false,
  },
];

export default async function LandingPage() {
  const session = await getSession();
  const signedIn = !!session;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Logo />
          <span>my-api</span>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#pricing"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:inline-block"
          >
            Pricing
          </a>
          {signedIn ? (
            <Link
              href="/dashboard/schemas"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              Go to my account
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Your data → your REST API, in minutes
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Build custom REST endpoints without writing a backend
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Define your own data structures, generate secure REST endpoints from them, and call
          them from anywhere with access tokens that are unique to your account.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {signedIn ? (
            <Link
              href="/dashboard/schemas"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Go to my account
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Create your first endpoint
              </Link>
              <Link
                href="/sign-in"
                className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Code preview */}
        <div className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-left shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-slate-700/50 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-slate-400">curl</span>
          </div>
          <pre className="scroll-thin overflow-x-auto px-4 py-4 text-sm leading-relaxed text-slate-100">
            <code>{`curl -X POST https://your-app/api/v1/notes \\
  -H "Authorization: Bearer mapi_•••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "Hello", "done": false }'`}</code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Simple, transparent pricing</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Start free and upgrade when you need more endpoints, tokens, and throughput.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} signedIn={signedIn} />
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-sm text-slate-500">
          my-api — custom REST endpoints backed by MongoDB, Redis, and per-account access tokens.
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  tier,
  signedIn,
}: {
  tier: (typeof tiers)[number];
  signedIn: boolean;
}) {
  // When signed in, every CTA becomes "Go to my account" → the dashboard.
  const ctaHref = signedIn ? "/dashboard/schemas" : tier.cta.href;
  const ctaLabel = signedIn ? "Go to my account" : tier.cta.label;

  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
        (tier.featured ? "border-indigo-300 ring-2 ring-indigo-200" : "border-slate-200")
      }
    >
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          Most popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{tier.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.price}</span>
        {tier.cadence && <span className="text-sm text-slate-500">{tier.cadence}</span>}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
            <svg
              className="mt-0.5 shrink-0 text-indigo-600"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {feat}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={
          "mt-8 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition " +
          (tier.featured
            ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
            : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50")
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function Logo() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
        <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}
