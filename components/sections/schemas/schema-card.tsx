"use client";

import { useState } from "react";
import { useDeleteSchema } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/util";
import type { DataSchema } from "@/lib/client/types";
import { Card } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { ErrorText } from "@/components/atoms/error-text";
import { PencilIcon } from "@/components/atoms/icons/pencil-icon";
import { TrashIcon } from "@/components/atoms/icons/trash-icon";

export function SchemaCard({
  schema,
  onEdit,
}: {
  schema: DataSchema;
  onEdit: () => void;
}) {
  const del = useDeleteSchema();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!confirm(`Delete schema "${schema.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await del.mutateAsync(schema.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
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
            aria-label="Edit schema"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onDelete}
            disabled={del.isPending}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Delete schema"
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
              {f.required && <Badge tone="amber">required</Badge>}
              {f.unique && <Badge tone="green">unique</Badge>}
            </span>
          </div>
        ))}
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      <p className="mt-4 text-xs text-slate-400">Created {formatDate(schema.createdAt)}</p>
    </Card>
  );
}
