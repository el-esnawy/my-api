"use client";

import { useState } from "react";
import { useDeleteEndpoint } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { appBaseUrl } from "@/lib/client/util";
import type { DataSchema, Endpoint, HttpMethod } from "@/lib/client/types";
import { Card } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ErrorText } from "@/components/atoms/error-text";
import { CopyButton } from "@/components/molecules/copy-button";
import { EndpointFieldList } from "./endpoint-field-list";

const methodTone: Record<HttpMethod, "green" | "indigo" | "amber" | "slate" | "red"> = {
  GET: "green",
  POST: "indigo",
  PUT: "amber",
  PATCH: "amber",
  DELETE: "red",
};

export function EndpointCard({
  endpoint,
  schema,
  onEdit,
}: {
  endpoint: Endpoint;
  schema?: DataSchema;
  onEdit: () => void;
}) {
  const del = useDeleteEndpoint();
  const [error, setError] = useState<string | null>(null);
  const url = `${appBaseUrl()}/api/v1/${endpoint.slug}`;

  async function onDelete() {
    if (!confirm(`Delete endpoint "${endpoint.name}"? Its stored records will be removed.`)) return;
    setError(null);
    try {
      await del.mutateAsync(endpoint.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{endpoint.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Schema: <span className="font-mono">{schema?.slug ?? "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {endpoint.methods.map((m) => (
            <Badge key={m} tone={methodTone[m]} className="font-mono">
              {m}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
        <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-slate-100">
          {url}
        </code>
        <CopyButton value={url} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <EndpointFieldList label="Readable (GET)" fields={endpoint.readableFields} schema={schema} />
        <EndpointFieldList
          label="Writable (POST/PUT/PATCH)"
          fields={endpoint.writableFields}
          schema={schema}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        {error ? <ErrorText>{error}</ErrorText> : <span />}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="dangerGhost" onClick={onDelete} disabled={del.isPending}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
