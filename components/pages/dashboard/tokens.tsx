"use client";

import { useMemo, useState } from "react";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Request Tokens</h1>
          <p className="mt-1 text-sm text-slate-500">
            Request tokens authenticate external calls to your endpoints. Each is scoped to
            the endpoints and permissions you choose.
          </p>
        </div>
        <Button onClick={() => setModal({})} disabled={!endpoints || endpoints.length === 0}>
          + New request token
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> Loading request tokens…
          </div>
        ) : !endpoints || endpoints.length === 0 ? (
          <EmptyState
            title="Create an endpoint first"
            description="Request tokens grant access to specific endpoints. Create one in the Endpoints tab."
          />
        ) : !tokens || tokens.length === 0 ? (
          <EmptyState
            title="No request tokens yet"
            description="Mint a request token to start calling your endpoints from anywhere."
            action={<Button onClick={() => setModal({})}>+ New request token</Button>}
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
