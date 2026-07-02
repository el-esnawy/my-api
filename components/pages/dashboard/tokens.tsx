"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTokens, useEndpoints } from "@/lib/client/hooks";
import type { AccessToken, Endpoint } from "@/lib/client/types";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/atoms/spinner";
import { EmptyState } from "@/components/molecules/empty-state";
import { TokenCard } from "@/components/sections/tokens/token-card";
import { TokenFormModal } from "@/components/sections/tokens/token-form-modal";

// `null` = closed; `{ token }` = edit; `{}` = create.
type ModalState = { token?: AccessToken } | null;

export default function TokensPage() {
  const { t } = useTranslation();
  const { data: tokens, isLoading } = useTokens();
  const { data: endpoints } = useEndpoints();
  const [modal, setModal] = useState<ModalState>(null);

  const endpointById = useMemo(() => {
    const map = new Map<string, Endpoint>();
    (endpoints ?? []).forEach((e) => map.set(e.id, e));
    return map;
  }, [endpoints]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("tokens.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("tokens.description")}
          </p>
        </div>
        <Button onClick={() => setModal({})} disabled={!endpoints || endpoints.length === 0}>
          {t("tokens.new")}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> {t("tokens.loading")}
          </div>
        ) : !endpoints || endpoints.length === 0 ? (
          <EmptyState
            title={t("tokens.emptyNeedsEndpointTitle")}
            description={t("tokens.emptyNeedsEndpointDescription")}
          />
        ) : !tokens || tokens.length === 0 ? (
          <EmptyState
            title={t("tokens.emptyTitle")}
            description={t("tokens.emptyDescription")}
            action={<Button onClick={() => setModal({})}>{t("tokens.new")}</Button>}
          />
        ) : (
          <div className="space-y-3">
            {tokens.map((t) => (
              <TokenCard
                key={t.id}
                token={t}
                endpointById={endpointById}
                onEdit={() => setModal({ token: t })}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <TokenFormModal
          editing={modal.token}
          onClose={() => setModal(null)}
          endpoints={endpoints ?? []}
        />
      )}
    </div>
  );
}
