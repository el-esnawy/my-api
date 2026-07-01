"use client";

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
  const { data: schemas, isLoading } = useSchemas();
  const { data: counts } = useEntryCounts();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Loading schemas…
      </div>
    );
  }

  if (!schemas || schemas.length === 0) {
    return (
      <EmptyState
        title="No schemas yet"
        description="Entries live inside schemas. Create a schema first, then manage its data here."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schemas.map((schema) => {
        const count = counts?.[schema.id] ?? 0;
        return (
          <button
            key={schema.id}
            type="button"
            onClick={() => onSelect(schema)}
            className="text-left"
          >
            <Card className="h-full p-5 transition hover:border-indigo-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{schema.name}</h3>
                  <Badge tone="indigo" className="mt-1 font-mono">
                    {schema.slug}
                  </Badge>
                </div>
                <Badge tone={count > 0 ? "green" : "slate"}>
                  {count} {count === 1 ? "entry" : "entries"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {schema.fields.length} {schema.fields.length === 1 ? "field" : "fields"}:{" "}
                <span className="font-mono text-xs">
                  {schema.fields.map((f) => f.name).join(", ")}
                </span>
              </p>
              <p className="mt-3 text-sm font-medium text-indigo-600">Manage entries →</p>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
