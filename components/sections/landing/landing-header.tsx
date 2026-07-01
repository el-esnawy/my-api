import Link from "next/link";
import { Logo } from "@/components/atoms/logo";

export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  return (
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
  );
}
