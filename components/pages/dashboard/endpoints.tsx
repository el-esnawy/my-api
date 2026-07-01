"use client";

import { useMemo, useState } from "react";
import { useEndpoints, useSchemas } from "@/lib/client/hooks";
import type { DataSchema, Endpoint } from "@/lib/client/types";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/atoms/spinner";
import { EmptyState } from "@/components/molecules/empty-state";
import { EndpointCard } from "@/components/sections/endpoints/endpoint-card";
import { EndpointFormModal } from "@/components/sections/endpoints/endpoint-form-modal";

// `null` = closed; `{ endpoint }` = edit; `{}` = create.
type ModalState = { endpoint?: Endpoint } | null;

export default function EndpointsPage() {
  const { data: endpoints, isLoading } = useEndpoints();
  const { data: schemas } = useSchemas();
  const [modal, setModal] = useState<ModalState>(null);

  const schemaById = useMemo(() => {
    const map = new Map<string, DataSchema>();
    (schemas ?? []).forEach((s) => map.set(s.id, s));
    return map;
  }, [schemas]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Endpoints</h1>
          <p className="mt-1 text-sm text-slate-500">
            Expose schemas as REST endpoints. Choose verbs and what can be read or written.
          </p>
        </div>
        <Button onClick={() => setModal({})} disabled={!schemas || schemas.length === 0}>
          + New endpoint
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> Loading endpoints…
          </div>
        ) : !schemas || schemas.length === 0 ? (
          <EmptyState
            title="Create a schema first"
            description="Endpoints are built on schemas. Head to the Schemas tab to define one."
          />
        ) : !endpoints || endpoints.length === 0 ? (
          <EmptyState
            title="No endpoints yet"
            description="Turn one of your schemas into a callable REST endpoint."
            action={<Button onClick={() => setModal({})}>+ New endpoint</Button>}
          />
        ) : (
          <div className="space-y-4">
            {endpoints.map((ep) => (
              <EndpointCard
                key={ep.id}
                endpoint={ep}
                schema={schemaById.get(ep.schemaId)}
                onEdit={() => setModal({ endpoint: ep })}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <EndpointFormModal
          editing={modal.endpoint}
          onClose={() => setModal(null)}
          schemas={schemas ?? []}
        />
      )}
    </div>
  );
}
