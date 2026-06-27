"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignUp, keys } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button, Card, ErrorText, Input, Label, Spinner } from "@/components/ui";

export default function SignUpPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const signUp = useSignUp();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      const { user } = await signUp.mutateAsync({
        name: form.name || undefined,
        email: form.email,
        password: form.password,
      });
      qc.setQueryData(keys.me, user);
      router.replace("/dashboard/schemas");
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
      <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Start building custom REST endpoints in minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ada Lovelace"
          />
        </div>
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
            placeholder="At least 8 characters"
          />
          <ErrorText>{fieldErrors.password}</ErrorText>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={signUp.isPending}>
          {signUp.isPending && <Spinner />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
