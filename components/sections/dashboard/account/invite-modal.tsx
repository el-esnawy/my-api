"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateInvite } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import type { OrgRole } from "@/lib/client/types";
import { Modal } from "@/components/molecules/modal";
import { CopyButton } from "@/components/molecules/copy-button";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select } from "@/components/atoms/select";
import { Spinner } from "@/components/atoms/spinner";

export function InviteModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const create = useCreateInvite();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ emailSent: boolean; acceptUrl?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await create.mutateAsync({ email, role: role === "owner" ? "admin" : role });
      setResult({ emailSent: res.emailSent, acceptUrl: res.acceptUrl });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWentWrong"));
    }
  }

  // --- Confirmation screen ---
  if (result) {
    return (
      <Modal open onClose={onClose} title={t("account.team.modal.title")}>
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {result.emailSent
              ? t("account.team.modal.created")
              : t("account.team.modal.createdNoEmail")}
          </div>
          {result.acceptUrl && (
            <div>
              <Label>{t("account.team.modal.acceptUrlLabel")}</Label>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
                <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-green-300">
                  {result.acceptUrl}
                </code>
                <CopyButton value={result.acceptUrl} />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={onClose}>{t("common.done")}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t("account.team.modal.title")}
      description={t("account.team.modal.description")}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="invite-email">{t("account.team.modal.emailLabel")}</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("account.team.modal.emailPlaceholder")}
          />
        </div>
        <div>
          <Label>{t("account.team.modal.roleLabel")}</Label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            options={[
              { value: "member", label: t("account.roles.member") },
              { value: "admin", label: t("account.roles.admin") },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Spinner />}
            {t("account.team.modal.invite")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
