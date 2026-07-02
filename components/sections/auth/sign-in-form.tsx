"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSignIn, keys } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ErrorText } from "@/components/atoms/error-text";
import { Spinner } from "@/components/atoms/spinner";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useTranslation();
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
      const nextIsSafe = next && (next.startsWith("/dashboard") || next.startsWith("/invite/"));
      router.replace(nextIsSafe ? next : "/dashboard/schemas");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError(t("common.somethingWentWrongRetry"));
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">{t("auth.fields.email")}</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder={t("auth.placeholders.email")}
        />
        <ErrorText>{fieldErrors.email}</ErrorText>
      </div>
      <div>
        <Label htmlFor="password">{t("auth.fields.password")}</Label>
        <Input
          id="password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder={t("auth.signIn.passwordPlaceholder")}
        />
        <ErrorText>{fieldErrors.password}</ErrorText>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={signIn.isPending}>
        {signIn.isPending && <Spinner />}
        {t("common.signIn")}
      </Button>
    </form>
  );
}
