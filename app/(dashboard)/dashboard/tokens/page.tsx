"use client";

import { useMemo, useState } from "react";
import {
  useTokens,
  useEndpoints,
  useCreateToken,
  useUpdateToken,
  useDeleteToken,
} from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/util";
import type { AccessToken, Endpoint, TokenGrant } from "@/lib/client/types";
import { Modal } from "@/components/Modal";
import { CopyButton } from "@/components/CopyButton";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorText,
  Input,
  Label,
  Spinner,
} from "@/components/ui";

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
          <h1 className="text-2xl font-bold text-slate-900">Access Tokens</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tokens authenticate external calls to your endpoints. Each is scoped to the
            endpoints and permissions you choose.
          </p>
        </div>
        <Button onClick={() => setModal({})} disabled={!endpoints || endpoints.length === 0}>
          + New token
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> Loading tokens…
          </div>
        ) : !endpoints || endpoints.length === 0 ? (
          <EmptyState
            title="Create an endpoint first"
            description="Tokens grant access to specific endpoints. Create one in the Endpoints tab."
          />
        ) : !tokens || tokens.length === 0 ? (
          <EmptyState
            title="No tokens yet"
            description="Mint an access token to start calling your endpoints from anywhere."
            action={<Button onClick={() => setModal({})}>+ New token</Button>}
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

function TokenCard({
  token,
  endpointById,
  onEdit,
}: {
  token: AccessToken;
  endpointById: Map<string, Endpoint>;
  onEdit: () => void;
}) {
  const update = useUpdateToken();
  const del = useDeleteToken();
  const [error, setError] = useState<string | null>(null);

  async function onRevoke() {
    setError(null);
    try {
      await update.mutateAsync({ id: token.id, revoked: !token.revoked });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update");
    }
  }

  async function onDelete() {
    if (!confirm(`Delete token "${token.name}"? Calls using it will stop working.`)) return;
    setError(null);
    try {
      await del.mutateAsync(token.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{token.name}</h3>
            {token.revoked && <Badge tone="red">revoked</Badge>}
          </div>
          <code className="mt-1 inline-block text-sm text-slate-500">
            {token.tokenPrefix}…••••
          </code>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={onRevoke} disabled={update.isPending}>
            {token.revoked ? "Re-enable" : "Revoke"}
          </Button>
          <Button size="sm" variant="dangerGhost" onClick={onDelete} disabled={del.isPending}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Endpoint access
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {token.grants.length === 0 ? (
            <span className="text-sm text-slate-400">no endpoints</span>
          ) : (
            token.grants.map((g) => {
              const ep = endpointById.get(g.endpointId);
              return (
                <span
                  key={g.endpointId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm"
                >
                  <span className="font-mono text-slate-700">{ep?.slug ?? "deleted"}</span>
                  {g.read && <Badge tone="green">R</Badge>}
                  {g.write && <Badge tone="indigo">W</Badge>}
                </span>
              );
            })
          )}
        </div>
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      <p className="mt-4 text-xs text-slate-400">
        Created {formatDate(token.createdAt)} · Last used {formatDate(token.lastUsedAt)}
      </p>
    </Card>
  );
}

function grantsMapFromToken(
  t?: AccessToken
): Record<string, { read: boolean; write: boolean }> {
  const map: Record<string, { read: boolean; write: boolean }> = {};
  (t?.grants ?? []).forEach((g) => {
    map[g.endpointId] = { read: g.read, write: g.write };
  });
  return map;
}

function TokenFormModal({
  editing,
  onClose,
  endpoints,
}: {
  editing?: AccessToken;
  onClose: () => void;
  endpoints: Endpoint[];
}) {
  const create = useCreateToken();
  const update = useUpdateToken();
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name ?? "");
  const [grants, setGrants] = useState<Record<string, { read: boolean; write: boolean }>>(
    () => grantsMapFromToken(editing)
  );
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  function setGrant(id: string, patch: Partial<{ read: boolean; write: boolean }>) {
    setGrants((prev) => {
      const current = prev[id] ?? { read: false, write: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selected: TokenGrant[] = Object.entries(grants)
      .filter(([, g]) => g.read || g.write)
      .map(([endpointId, g]) => ({ endpointId, read: g.read, write: g.write }));

    if (selected.length === 0) {
      setError("Grant access to at least one endpoint");
      return;
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: editing!.id, name, grants: selected });
        onClose();
      } else {
        const res = await create.mutateAsync({ name, grants: selected });
        setSecret(res.plaintext);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  // --- Secret reveal screen (create only) ---
  if (secret) {
    return (
      <Modal open onClose={onClose} title="Token created" widthClass="max-w-xl">
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Copy this token now — it&apos;s shown only once and cannot be retrieved later.
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-3">
            <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-green-300">
              {secret}
            </code>
            <CopyButton value={secret} label="Copy" />
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Use it as a bearer token:
            <pre className="scroll-thin mt-1 overflow-x-auto text-slate-700">
              {`Authorization: Bearer ${secret}`}
            </pre>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // --- Create / edit form ---
  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit token" : "New access token"}
      description={
        isEdit
          ? "Update the name and which endpoints this token can reach. The token value stays the same."
          : "Choose which endpoints this token can reach and what it can do."
      }
      widthClass="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Token name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production server"
            required
          />
        </div>

        <div>
          <Label>Endpoint permissions</Label>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {endpoints.map((ep) => {
              const g = grants[ep.id] ?? { read: false, write: false };
              return (
                <div
                  key={ep.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{ep.name}</p>
                    <code className="text-xs text-slate-400">/api/v1/{ep.slug}</code>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Checkbox
                        checked={g.read}
                        onChange={(e) => setGrant(ep.id, { read: e.target.checked })}
                      />
                      Read
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Checkbox
                        checked={g.write}
                        onChange={(e) => setGrant(ep.id, { write: e.target.checked })}
                      />
                      Write
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {isEdit ? "Save changes" : "Create token"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
