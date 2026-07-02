"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMe, useUpdateProfile } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ErrorText } from "@/components/atoms/error-text";
import { Spinner } from "@/components/atoms/spinner";
import { Card } from "@/components/atoms/card";
import { ToastStack, type ToastData } from "@/components/molecules/toast";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: user } = useMe();
  const update = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email);
  }, [user]);

  const pushToast = useCallback((message: string, tone: ToastData["tone"]) => {
    toastId.current += 1;
    setToasts((prev) => [...prev, { id: toastId.current, message, tone }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  if (!user) return null;

  const emailChanged = email !== user.email;
  const nameChanged = name !== (user.name ?? "");
  const dirty = emailChanged || nameChanged;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      await update.mutateAsync({
        ...(nameChanged ? { name } : {}),
        ...(emailChanged ? { email, currentPassword } : {}),
      });
      setCurrentPassword("");
      pushToast(t("account.profile.saved"), "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError(t("account.profile.saveFailed"));
      }
    }
  }

  return (
    <div>
      <Card className="max-w-lg p-6">
        <h2 className="font-semibold text-slate-900">{t("account.profile.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("account.profile.description")}</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="name">{t("account.profile.nameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("account.profile.namePlaceholder")}
            />
            <ErrorText>{fieldErrors.name}</ErrorText>
          </div>
          <div>
            <Label htmlFor="email">{t("account.profile.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ErrorText>{fieldErrors.email}</ErrorText>
          </div>
          {emailChanged && (
            <div>
              <Label htmlFor="currentPassword">{t("account.profile.currentPasswordLabel")}</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">{t("account.profile.currentPasswordHint")}</p>
              <ErrorText>{fieldErrors.currentPassword}</ErrorText>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" disabled={!dirty || update.isPending}>
            {update.isPending && <Spinner />}
            {t("account.profile.save")}
          </Button>
        </form>
      </Card>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
