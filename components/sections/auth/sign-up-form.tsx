"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSignUp, keys } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ErrorText } from "@/components/atoms/error-text";
import { Spinner } from "@/components/atoms/spinner";

export function SignUpForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const signUp = useSignUp();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
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
        confirmPassword: form.confirmPassword,
      });
      qc.setQueryData(keys.me, user);
      router.replace("/dashboard/schemas");
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
        <Label htmlFor="name">{t("auth.fields.nameOptional")}</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("auth.placeholders.name")}
        />
      </div>
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
          placeholder={t("auth.signUp.passwordPlaceholder")}
        />
        <ErrorText>{fieldErrors.password}</ErrorText>
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t("auth.fields.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
        />
        <ErrorText>{fieldErrors.confirmPassword}</ErrorText>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={signUp.isPending}>
        {signUp.isPending && <Spinner />}
        {t("auth.signUp.title")}
      </Button>
    </form>
  );
}
