"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteSchema } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/util";
import type { DataSchema } from "@/lib/client/types";
import { Card } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { ErrorText } from "@/components/atoms/error-text";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { PencilIcon } from "@/components/atoms/icons/pencil-icon";
import { TrashIcon } from "@/components/atoms/icons/trash-icon";

export function SchemaCard({
  schema,
  onEdit,
}: {
  schema: DataSchema;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation();
  const del = useDeleteSchema();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onDelete() {
    setError(null);
    try {
      await del.mutateAsync(schema.id);
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("schemas.deleteFailed"));
    }
  }

  return (
    <>
      <Card className="flex flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">{schema.name}</h3>
            <Badge tone="indigo" className="mt-1 font-mono">
              {schema.slug}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
              aria-label={t("schemas.editAria")}
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={del.isPending}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label={t("schemas.deleteAria")}
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {schema.fields.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm"
            >
              <span className="font-mono text-slate-700">{f.name}</span>
              <span className="flex items-center gap-1.5">
                <Badge>{f.type}</Badge>
                {f.required && <Badge tone="amber">{t("common.required")}</Badge>}
                {f.unique && <Badge tone="green">{t("common.unique")}</Badge>}
              </span>
            </div>
          ))}
        </div>

        {error && <ErrorText>{error}</ErrorText>}
        <p className="mt-4 text-xs text-slate-400">
          {t("common.created", { date: formatDate(schema.createdAt, i18n.language) })}
        </p>
      </Card>
      <ConfirmModal
        open={confirmOpen}
        title={t("common.delete")}
        description={t("schemas.deleteConfirm", { name: schema.name })}
        confirmLabel={t("common.delete")}
        pending={del.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
}
