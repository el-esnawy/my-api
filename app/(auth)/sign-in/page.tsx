"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignIn, keys } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button, Card, ErrorText, Input, Label, Spinner } from "@/components/ui";

function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const qc = useQueryClient();
  const signIn = useSignIn();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      const { user } = await signIn.mutateAsync(form);
      qc.setQueryData(keys.me, user);
      const next = search.get("next");
      router.replace(next && next.startsWith("/dashboard") ? next : "/dashboard/schemas");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card className="p-7">
      <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to manage your endpoints.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          <ErrorText>{fieldErrors.email}</ErrorText>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Your password"
          />
          <ErrorText>{fieldErrors.password}</ErrorText>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending && <Spinner />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
