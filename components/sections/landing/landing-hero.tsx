import Link from "next/link";
import { CodePreview } from "./code-preview";

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  return (
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

      <CodePreview />
    </section>
  );
}
