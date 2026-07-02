"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { data: schemas, isLoading } = useSchemas();
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("schemas.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("schemas.description")}
          </p>
        </div>
        <Button onClick={() => setModal({})}>{t("schemas.new")}</Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> {t("schemas.loading")}
          </div>
        ) : !schemas || schemas.length === 0 ? (
          <EmptyState
            title={t("schemas.emptyTitle")}
            description={t("schemas.emptyDescription")}
            action={<Button onClick={() => setModal({})}>{t("schemas.new")}</Button>}
          />
        ) : (
          <div className="grid gap-4">
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
