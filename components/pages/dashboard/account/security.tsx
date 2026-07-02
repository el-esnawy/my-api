"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChangePassword } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ErrorText } from "@/components/atoms/error-text";
import { Spinner } from "@/components/atoms/spinner";
import { Card } from "@/components/atoms/card";
import { ToastStack, type ToastData } from "@/components/molecules/toast";

export default function SecurityPage() {
  const { t } = useTranslation();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  const pushToast = useCallback((message: string, tone: ToastData["tone"]) => {
    toastId.current += 1;
    setToasts((prev) => [...prev, { id: toastId.current, message, tone }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword, confirmNewPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      pushToast(t("account.security.saved"), "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError(t("account.security.saveFailed"));
      }
    }
  }

  return (
    <div>
      <Card className="p-6">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-slate-900">{t("account.security.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("account.security.description")}</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="currentPassword">{t("account.security.currentPassword")}</Label>
            <Input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <ErrorText>{fieldErrors.currentPassword}</ErrorText>
          </div>
          <div>
            <Label htmlFor="newPassword">{t("account.security.newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("account.security.newPasswordPlaceholder")}
            />
            <ErrorText>{fieldErrors.newPassword}</ErrorText>
          </div>
          <div>
            <Label htmlFor="confirmNewPassword">{t("account.security.confirmNewPassword")}</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder={t("account.security.confirmNewPasswordPlaceholder")}
            />
            <ErrorText>{fieldErrors.confirmNewPassword}</ErrorText>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending && <Spinner />}
            {t("account.security.save")}
          </Button>
          </form>
        </div>
      </Card>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
