"use client";

import { useTranslation } from "react-i18next";
import { useSchemas, useEntryCounts } from "@/lib/client/hooks";
import type { DataSchema } from "@/lib/client/types";
import { Badge } from "@/components/atoms/badge";
import { Card } from "@/components/atoms/card";
import { Spinner } from "@/components/atoms/spinner";
import { EmptyState } from "@/components/molecules/empty-state";

/**
 * Main Entries view: every schema as a clickable card. Selecting one opens
 * the entries editor sub-view for that schema.
 */
export function EntriesSchemaList({
  onSelect,
}: {
  onSelect: (schema: DataSchema) => void;
}) {
  const { t } = useTranslation();
  const { data: schemas, isLoading } = useSchemas();
  const { data: counts } = useEntryCounts();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> {t("entries.loadingSchemas")}
      </div>
    );
  }

  if (!schemas || schemas.length === 0) {
    return (
      <EmptyState
        title={t("entries.emptySchemasTitle")}
        description={t("entries.emptySchemasDescription")}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {schemas.map((schema) => {
        const count = counts?.[schema.id] ?? 0;
        return (
          <button
            key={schema.id}
            type="button"
            onClick={() => onSelect(schema)}
            className="text-left"
          >
            <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:hover:border-indigo-500/50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{schema.name}</h3>
                  <Badge tone="indigo" className="mt-1 font-mono">
                    {schema.slug}
                  </Badge>
                </div>
                <Badge tone={count > 0 ? "green" : "slate"}>
                  {t("common.entry", { count })}
                </Badge>
              </div>
              <p className="mt-3 max-w-5xl text-sm text-slate-500">
                {t("common.field", { count: schema.fields.length })}:{" "}
                <span className="font-mono text-xs">
                  {schema.fields.map((f) => f.name).join(", ")}
                </span>
              </p>
              <p className="mt-3 text-sm font-medium text-indigo-600">{t("entries.manage")}</p>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
