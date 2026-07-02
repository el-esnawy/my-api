"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  useEntries,
  useBatchSaveEntries,
  useImportEntries,
} from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import type {
  BatchItemError,
  DataSchema,
  Entry,
  ImportResult,
} from "@/lib/client/types";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/atoms/spinner";
import { BackIcon } from "@/components/atoms/icons/back-icon";
import { UploadIcon } from "@/components/atoms/icons/upload-icon";
import { PencilIcon } from "@/components/atoms/icons/pencil-icon";
import { TrashIcon } from "@/components/atoms/icons/trash-icon";
import { EmptyState } from "@/components/molecules/empty-state";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { EntryFormModal } from "./entry-form-modal";
import { ImportResultModal } from "./import-result-modal";
import { UnsavedChangesModal } from "./unsaved-changes-modal";

type RowStatus = "clean" | "new" | "modified" | "deleted";

interface DraftRow {
  /** Stable UI key: the server id, or a temp id for staged creates. */
  key: string;
  /** Server id when the entry is persisted. */
  id?: string;
  data: Record<string, unknown>;
  status: RowStatus;
  /** Status before a staged delete, so restore puts the row back correctly. */
  prevStatus?: RowStatus;
  createdAt: string | null;
  /** Field errors from the last failed save. */
  errors?: Record<string, string>;
}

function buildRows(entries: Entry[] | undefined): DraftRow[] {
  return (entries ?? []).map((e) => ({
    key: e.id,
    id: e.id,
    data: e.data,
    status: "clean" as const,
    createdAt: e.createdAt,
  }));
}

function formatCell(
  value: unknown,
  type: string,
  t: (key: string) => string,
  language: string
): React.ReactNode {
  if (value === undefined || value === null || value === "") {
    return <span className="text-slate-300">—</span>;
  }
  if (type === "boolean") {
    return (
      <Badge tone={value === true ? "green" : "slate"}>
        {value === true ? t("common.true") : t("common.false")}
      </Badge>
    );
  }
  if (type === "date") {
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleString(language);
  }
  return String(value);
}

const statusTone: Record<Exclude<RowStatus, "clean">, "indigo" | "amber" | "red"> = {
  new: "indigo",
  modified: "amber",
  deleted: "red",
};

export function EntriesEditor({
  schema,
  onBack,
  onToast,
}: {
  schema: DataSchema;
  onBack: () => void;
  onToast: (message: string, tone: "success" | "warning" | "error") => void;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: entries, isLoading, refetch } = useEntries(schema.id);
  const save = useBatchSaveEntries(schema.id);
  const importEntries = useImportEntries(schema.id);

  const [rows, setRows] = useState<DraftRow[]>(() => buildRows(entries));
  const tempCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirtyCount = useMemo(
    () => rows.filter((r) => r.status !== "clean").length,
    [rows]
  );
  const dirty = dirtyCount > 0;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Rebuild the working set from the server whenever fresh data arrives and
  // there's nothing staged (a background refetch must not clobber edits).
  useEffect(() => {
    if (!dirtyRef.current) setRows(buildRows(entries));
  }, [entries]);

  // --- Unsaved-changes guards ---------------------------------------------
  const [guard, setGuard] = useState<{ open: boolean; action: (() => void) | null }>({
    open: false,
    action: null,
  });

  const requestNavigation = useCallback((action: () => void) => {
    if (dirtyRef.current) setGuard({ open: true, action });
    else action();
  }, []);

  // Intercept in-app link clicks (dashboard tabs, logo, …) while dirty.
  useEffect(() => {
    if (!dirty) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.origin !== window.location.origin) return;
      const dest = anchor.pathname + anchor.search;
      e.preventDefault();
      e.stopPropagation();
      setGuard({ open: true, action: () => router.push(dest) });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, router]);

  // Keep the browser-native alert for refresh/close; custom modals cannot block
  // those hard navigations.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // --- Staged CRUD ----------------------------------------------------------
  const [formModal, setFormModal] = useState<{ row?: DraftRow } | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  function addEntry(data: Record<string, unknown>) {
    tempCounter.current += 1;
    const key = `tmp_${tempCounter.current}`;
    setRows((prev) => [
      ...prev,
      { key, data, status: "new", createdAt: null },
    ]);
    setFormModal(null);
  }

  function applyEdit(key: string, data: Record<string, unknown>) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              data,
              status: r.status === "new" ? "new" : "modified",
              errors: undefined,
            }
          : r
      )
    );
    setFormModal(null);
  }

  function stageDelete(row: DraftRow) {
    if (row.status === "new") {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.key === row.key ? { ...r, prevStatus: r.status, status: "deleted" } : r
      )
    );
  }

  function restore(row: DraftRow) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === row.key ? { ...r, status: r.prevStatus ?? "clean", prevStatus: undefined } : r
      )
    );
  }

  function discardChanges() {
    setRows(buildRows(entries));
    setDiscardConfirmOpen(false);
  }

  // --- Save -----------------------------------------------------------------
  async function onSave() {
    const payload = {
      creates: rows
        .filter((r) => r.status === "new")
        .map((r) => ({ tempId: r.key, data: r.data })),
      updates: rows
        .filter((r) => r.status === "modified" && r.id)
        .map((r) => ({ id: r.id!, data: r.data })),
      deletes: rows.filter((r) => r.status === "deleted" && r.id).map((r) => r.id!),
    };
    try {
      const result = await save.mutateAsync(payload);
      const fresh = await refetch();
      setRows(buildRows(fresh.data));
      onToast(t("entries.editor.saved", { count: result.created + result.updated + result.deleted }), "success");
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.body?.items)) {
        const items = err.body.items as BatchItemError[];
        setRows((prev) =>
          prev.map((r) => {
            const mine = items.filter(
              (it) => (it.tempId && it.tempId === r.key) || (it.id && it.id === r.id)
            );
            if (mine.length === 0) return { ...r, errors: undefined };
            const fields: Record<string, string> = {};
            for (const it of mine) Object.assign(fields, it.fields);
            return { ...r, errors: fields };
          })
        );
        onToast(t("entries.editor.nothingSaved"), "error");
      } else {
        onToast(err instanceof ApiError ? err.message : t("entries.editor.saveFailed"), "error");
      }
    }
  }

  // --- Import ----------------------------------------------------------------
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      onToast(t("entries.editor.invalidJson"), "error");
      return;
    }
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as any).entries)
        ? (parsed as any).entries
        : null;
    if (!list) {
      onToast(t("entries.editor.expectedArray"), "error");
      return;
    }

    try {
      const result = await importEntries.mutateAsync(list);
      if (result.rejected.length === 0) {
        onToast(t("entries.editor.imported", { count: result.imported }), "success");
      } else {
        setImportResult(result);
        if (result.imported > 0) {
          onToast(
            t("entries.editor.importedPartial", {
              imported: result.imported,
              total: result.total,
              rejected: result.rejected.length,
            }),
            "warning"
          );
        }
      }
    } catch (err) {
      onToast(err instanceof ApiError ? err.message : t("entries.editor.importFailed"), "error");
    }
  }

  // --- Render ------------------------------------------------------------------
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => requestNavigation(onBack)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label={t("entries.editor.backAria")}
          >
            <BackIcon size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {schema.name} <span className="text-slate-400">{t("entries.editor.headingSuffix")}</span>
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("entries.editor.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={dirty || importEntries.isPending}
            title={dirty ? t("entries.editor.importDisabledTitle") : undefined}
          >
            {importEntries.isPending ? <Spinner /> : <UploadIcon size={16} />}
            {t("entries.editor.importJson")}
          </Button>
          <Button variant="secondary" onClick={() => setFormModal({})}>
            {t("entries.editor.addEntry")}
          </Button>
        </div>
      </div>

      {dirty && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5">
          <span className="text-sm font-medium text-indigo-800">
            {t("entries.editor.unsaved", { count: dirtyCount })}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDiscardConfirmOpen(true)}>
              {t("entries.editor.discard")}
            </Button>
            <Button size="sm" onClick={onSave} disabled={save.isPending}>
              {save.isPending && <Spinner />}
              {t("common.saveChanges")}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner /> {t("entries.editor.loading")}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t("entries.editor.emptyTitle")}
            description={t("entries.editor.emptyDescription")}
            action={
              <Button onClick={() => setFormModal({})}>{t("entries.editor.addEntry")}</Button>
            }
          />
        ) : (
          <div className="scroll-thin overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-3 py-2.5 font-medium text-slate-400">{t("entries.editor.tableIndex")}</th>
                  {schema.fields.map((f) => (
                    <th key={f.name} className="px-3 py-2.5 font-mono font-medium text-slate-600">
                      {f.name}
                      {f.unique && <span className="ml-1 text-xs text-green-600">{t("common.unique")}</span>}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 font-medium text-slate-400">{t("common.status")}</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <EntryRow
                    key={row.key}
                    row={row}
                    index={i}
                    schema={schema}
                    statusLabel={
                      row.status === "clean" ? "" : t(`entries.editor.status.${row.status}`)
                    }
                    language={i18n.language}
                    onEdit={() => setFormModal({ row })}
                    onDelete={() => stageDelete(row)}
                    onRestore={() => restore(row)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formModal && (
        <EntryFormModal
          schema={schema}
          initialData={formModal.row?.data}
          serverErrors={formModal.row?.errors}
          onSubmit={(data) =>
            formModal.row ? applyEdit(formModal.row.key, data) : addEntry(data)
          }
          onClose={() => setFormModal(null)}
        />
      )}

      {importResult && (
        <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
      )}

      <ConfirmModal
        open={discardConfirmOpen}
        title={t("entries.editor.discard")}
        description={t("entries.editor.discardConfirm")}
        confirmLabel={t("entries.editor.discard")}
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={discardChanges}
      />

      <UnsavedChangesModal
        open={guard.open}
        onStay={() => setGuard({ open: false, action: null })}
        onLeave={() => {
          const action = guard.action;
          setGuard({ open: false, action: null });
          // Clear staging so guards don't re-fire during the navigation.
          setRows(buildRows(entries));
          dirtyRef.current = false;
          action?.();
        }}
      />
    </div>
  );
}

function EntryRow({
  row,
  index,
  schema,
  statusLabel,
  language,
  onEdit,
  onDelete,
  onRestore,
}: {
  row: DraftRow;
  index: number;
  schema: DataSchema;
  statusLabel: string;
  language: string;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const { t } = useTranslation();
  const deleted = row.status === "deleted";
  const hasErrors = row.errors && Object.keys(row.errors).length > 0;

  return (
    <>
      <tr
        className={
          "border-b border-slate-100 last:border-0 " +
          (deleted ? "opacity-45" : "") +
          (hasErrors ? " bg-red-50/60" : "")
        }
      >
        <td className="px-3 py-2 text-slate-400">{index + 1}</td>
        {schema.fields.map((f) => (
          <td
            key={f.name}
            className={"max-w-[16rem] truncate px-3 py-2 text-slate-700 " + (deleted ? "line-through" : "")}
          >
            {formatCell(row.data[f.name], f.type, t, language)}
          </td>
        ))}
        <td className="px-3 py-2">
          {row.status !== "clean" && (
            <Badge tone={statusTone[row.status as Exclude<RowStatus, "clean">]}>
              {statusLabel}
            </Badge>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-end gap-1">
            {deleted ? (
              <button
                onClick={onRestore}
                className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
              >
                {t("common.restore")}
              </button>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                  aria-label={t("entries.editor.editAria")}
                >
                  <PencilIcon size={15} />
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={t("entries.editor.deleteAria")}
                >
                  <TrashIcon size={15} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {hasErrors && (
        <tr className="border-b border-slate-100 bg-red-50/60">
          <td />
          <td colSpan={schema.fields.length + 2} className="px-3 pb-2 text-xs text-red-700">
            {Object.entries(row.errors!)
              .map(([field, msg]) => (field === "_root" ? msg : `${field} ${msg}`))
              .join(" · ")}
          </td>
        </tr>
      )}
    </>
  );
}
