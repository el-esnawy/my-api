"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold text-slate-900">{t("endpoints.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("endpoints.description")}
          </p>
        </div>
        <Button onClick={() => setModal({})} disabled={!schemas || schemas.length === 0}>
          {t("endpoints.new")}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> {t("endpoints.loading")}
          </div>
        ) : !schemas || schemas.length === 0 ? (
          <EmptyState
            title={t("endpoints.emptyNeedsSchemaTitle")}
            description={t("endpoints.emptyNeedsSchemaDescription")}
          />
        ) : !endpoints || endpoints.length === 0 ? (
          <EmptyState
            title={t("endpoints.emptyTitle")}
            description={t("endpoints.emptyDescription")}
            action={<Button onClick={() => setModal({})}>{t("endpoints.new")}</Button>}
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
          key={modal.endpoint?.id ?? "new"}
          editing={modal.endpoint}
          onClose={() => setModal(null)}
          schemas={schemas ?? []}
        />
      )}
    </div>
  );
}
