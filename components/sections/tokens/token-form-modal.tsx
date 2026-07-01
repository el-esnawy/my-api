"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateToken, useUpdateToken } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import type { AccessToken, Endpoint, TokenGrant } from "@/lib/client/types";
import { Modal } from "@/components/molecules/modal";
import { CopyButton } from "@/components/molecules/copy-button";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Checkbox } from "@/components/atoms/checkbox";
import { Spinner } from "@/components/atoms/spinner";

function grantsMapFromToken(
  t?: AccessToken
): Record<string, { read: boolean; write: boolean }> {
  const map: Record<string, { read: boolean; write: boolean }> = {};
  (t?.grants ?? []).forEach((g) => {
    map[g.endpointId] = { read: g.read, write: g.write };
  });
  return map;
}

export function TokenFormModal({
  editing,
  onClose,
  endpoints,
}: {
  editing?: AccessToken;
  onClose: () => void;
  endpoints: Endpoint[];
}) {
  const { t } = useTranslation();
  const create = useCreateToken();
  const update = useUpdateToken();
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name ?? "");
  const [grants, setGrants] = useState<Record<string, { read: boolean; write: boolean }>>(
    () => grantsMapFromToken(editing)
  );
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  function setGrant(id: string, patch: Partial<{ read: boolean; write: boolean }>) {
    setGrants((prev) => {
      const current = prev[id] ?? { read: false, write: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selected: TokenGrant[] = Object.entries(grants)
      .filter(([, g]) => g.read || g.write)
      .map(([endpointId, g]) => ({ endpointId, read: g.read, write: g.write }));

    if (selected.length === 0) {
      setError(t("tokens.modal.grantRequired"));
      return;
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: editing!.id, name, grants: selected });
        onClose();
      } else {
        const res = await create.mutateAsync({ name, grants: selected });
        setSecret(res.plaintext);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWentWrong"));
    }
  }

  // --- Secret reveal screen (create only) ---
  if (secret) {
    return (
      <Modal open onClose={onClose} title={t("tokens.modal.createdTitle")} widthClass="max-w-xl">
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t("tokens.modal.createdDescription")}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-3">
            <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-green-300">
              {secret}
            </code>
            <CopyButton value={secret} />
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            {t("tokens.modal.bearerHint")}
            <pre className="scroll-thin mt-1 overflow-x-auto text-slate-700">
              {`Authorization: Bearer ${secret}`}
            </pre>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>{t("common.done")}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // --- Create / edit form ---
  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t("tokens.modal.editTitle") : t("tokens.modal.newTitle")}
      description={
        isEdit
          ? t("tokens.modal.editDescription")
          : t("tokens.modal.newDescription")
      }
      widthClass="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>{t("tokens.modal.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("tokens.modal.namePlaceholder")}
            required
          />
        </div>

        <div>
          <Label>{t("tokens.modal.permissions")}</Label>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {endpoints.map((ep) => {
              const g = grants[ep.id] ?? { read: false, write: false };
              return (
                <div
                  key={ep.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{ep.name}</p>
                    <code className="text-xs text-slate-400">/api/v1/{ep.slug}</code>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Checkbox
                        checked={g.read}
                        onChange={(e) => setGrant(ep.id, { read: e.target.checked })}
                      />
                      {t("tokens.modal.read")}
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Checkbox
                        checked={g.write}
                        onChange={(e) => setGrant(ep.id, { write: e.target.checked })}
                      />
                      {t("tokens.modal.write")}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {isEdit ? t("common.saveChanges") : t("tokens.modal.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
