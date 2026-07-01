"use client";

import { useState } from "react";
import { useSchemas } from "@/lib/client/hooks";
import type { DataSchema } from "@/lib/client/types";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/atoms/spinner";
import { EmptyState } from "@/components/molecules/empty-state";
import { SchemaCard } from "@/components/sections/schemas/schema-card";
import { SchemaFormModal } from "@/components/sections/schemas/schema-form-modal";

// `null` = closed; `{ schema }` = edit; `{}` = create.
type ModalState = { schema?: DataSchema } | null;

export default function SchemasPage() {
  const { data: schemas, isLoading } = useSchemas();
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schemas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Define the shape of your data. Endpoints are built on top of schemas.
          </p>
        </div>
        <Button onClick={() => setModal({})}>+ New schema</Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> Loading schemas…
          </div>
        ) : !schemas || schemas.length === 0 ? (
          <EmptyState
            title="No schemas yet"
            description="Create your first schema to describe the data your endpoints will store."
            action={<Button onClick={() => setModal({})}>+ New schema</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {schemas.map((schema) => (
              <SchemaCard
                key={schema.id}
                schema={schema}
                onEdit={() => setModal({ schema })}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <SchemaFormModal editing={modal.schema} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
