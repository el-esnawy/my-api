"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAcceptInvite, useInviteDetails, useMe, keys } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ErrorText } from "@/components/atoms/error-text";
import { Spinner } from "@/components/atoms/spinner";
import { AuthFormCard } from "@/components/molecules/auth-form-card";

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: invite, isLoading, error: loadError } = useInviteDetails(token);
  const { data: me } = useMe();
  const acceptInvite = useAcceptInvite(token);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AuthFormCard title={t("invite.loading")} description="">
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      </AuthFormCard>
    );
  }

  if (loadError || !invite) {
    return (
      <AuthFormCard title={t("invite.notFound")} description="">
        <p className="mt-4 text-sm text-red-600">
          {loadError instanceof ApiError ? loadError.message : t("invite.notFound")}
        </p>
      </AuthFormCard>
    );
  }

  const signedInAsInvitee = me?.email === invite.email;

  async function onAccept(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      const { user } = await acceptInvite.mutateAsync(
        invite!.alreadyHasAccount
          ? {}
          : { name: name || undefined, password, confirmPassword }
      );
      qc.setQueryData(keys.me, user);
      router.replace("/dashboard/schemas");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError(t("invite.acceptFailed"));
      }
    }
  }

  return (
    <AuthFormCard
      title={t("invite.acceptTitle", { organization: invite.organizationName ?? "" })}
      description={t("invite.acceptDescription", {
        inviter: invite.inviterEmail ?? t("invite.unknownInviter"),
      })}
    >
      {invite.alreadyHasAccount ? (
        signedInAsInvitee ? (
          <div className="mt-6">
            {error && <ErrorText>{error}</ErrorText>}
            <Button
              size="lg"
              className="w-full"
              onClick={() => onAccept()}
              disabled={acceptInvite.isPending}
            >
              {acceptInvite.isPending && <Spinner />}
              {t("invite.accept")}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              {t("invite.signInPrompt", { email: invite.email })}
            </p>
            <Link
              href={`/sign-in?next=/invite/${token}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-base font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t("invite.signInCta")}
            </Link>
          </div>
        )
      ) : (
        <form onSubmit={onAccept} className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">{t("invite.createAccountDescription")}</p>
          <div>
            <Label htmlFor="name">{t("invite.nameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("invite.namePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="password">{t("invite.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("invite.passwordPlaceholder")}
            />
            <ErrorText>{fieldErrors.password}</ErrorText>
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t("invite.confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("invite.passwordPlaceholder")}
            />
            <ErrorText>{fieldErrors.confirmPassword}</ErrorText>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={acceptInvite.isPending}>
            {acceptInvite.isPending && <Spinner />}
            {t("invite.accept")}
          </Button>
        </form>
      )}
    </AuthFormCard>
  );
}
