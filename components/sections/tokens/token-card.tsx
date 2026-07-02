"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateToken, useDeleteToken, useRevealToken } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/util";
import type { AccessToken, Endpoint } from "@/lib/client/types";
import { Card } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ErrorText } from "@/components/atoms/error-text";
import { CopyButton } from "@/components/molecules/copy-button";
import { ConfirmModal } from "@/components/molecules/confirm-modal";

export function TokenCard({
  token,
  endpointById,
  onEdit,
}: {
  token: AccessToken;
  endpointById: Map<string, Endpoint>;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation();
  const update = useUpdateToken();
  const del = useDeleteToken();
  const reveal = useRevealToken();
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onRevoke() {
    setError(null);
    try {
      await update.mutateAsync({ id: token.id, revoked: !token.revoked });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("tokens.updateFailed"));
    }
  }

  async function onDelete() {
    setError(null);
    try {
      await del.mutateAsync(token.id);
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("tokens.deleteFailed"));
    }
  }

  async function onToggleReveal() {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setError(null);
    try {
      const value = await reveal.mutateAsync(token.id);
      setRevealed(value);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("tokens.revealFailed"));
    }
  }

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{token.name}</h3>
              {token.revoked && <Badge tone="red">{t("tokens.revoked")}</Badge>}
            </div>
            <code className="mt-1 inline-block text-sm text-slate-500">
              {token.tokenPrefix}…••••
            </code>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onToggleReveal}
              disabled={reveal.isPending}
            >
              {reveal.isPending ? t("tokens.revealing") : revealed ? t("tokens.hide") : t("tokens.view")}
            </Button>
            <Button size="sm" variant="secondary" onClick={onEdit}>
              {t("common.edit")}
            </Button>
            <Button size="sm" variant="secondary" onClick={onRevoke} disabled={update.isPending}>
              {token.revoked ? t("tokens.reEnable") : t("tokens.revoke")}
            </Button>
            <Button size="sm" variant="dangerGhost" onClick={() => setConfirmOpen(true)} disabled={del.isPending}>
              {t("common.delete")}
            </Button>
          </div>
        </div>

        {revealed && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
            <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-green-300">
              {revealed}
            </code>
            <CopyButton value={revealed} />
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("tokens.endpointAccess")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {token.grants.length === 0 ? (
              <span className="text-sm text-slate-400">{t("tokens.noEndpoints")}</span>
            ) : (
              token.grants.map((g) => {
                const ep = endpointById.get(g.endpointId);
                return (
                  <span
                    key={g.endpointId}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm"
                  >
                    <span className="font-mono text-slate-700">{ep?.slug ?? t("common.deleted")}</span>
                    {g.read && <Badge tone="green">R</Badge>}
                    {g.write && <Badge tone="indigo">W</Badge>}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {error && <ErrorText>{error}</ErrorText>}
        <p className="mt-4 text-xs text-slate-400">
          {t("common.created", { date: formatDate(token.createdAt, i18n.language) })} ·{" "}
          {t("common.lastUsed", { date: formatDate(token.lastUsedAt, i18n.language) })}
        </p>
      </Card>
      <ConfirmModal
        open={confirmOpen}
        title={t("common.delete")}
        description={t("tokens.deleteConfirm", { name: token.name })}
        confirmLabel={t("common.delete")}
        pending={del.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
}
