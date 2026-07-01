"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateEndpoint, useUpdateEndpoint } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { slugify } from "@/lib/client/util";
import type { DataSchema, Endpoint, HttpMethod } from "@/lib/client/types";
import { Modal } from "@/components/molecules/modal";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select } from "@/components/atoms/select";
import { Checkbox } from "@/components/atoms/checkbox";
import { Spinner } from "@/components/atoms/spinner";

const METHODS: HttpMethod[] = [
  "GET_MANY",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "PUT_MANY",
  "PATCH_MANY",
  "DELETE",
];

const methodLabels: Record<HttpMethod, string> = {
  GET_MANY: "GET many",
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  PUT_MANY: "PUT many",
  PATCH_MANY: "PATCH many",
  DELETE: "DELETE",
};

const activeMethodClasses: Record<HttpMethod, string> = {
  GET_MANY: "border-green-300 bg-green-50 text-green-700",
  GET: "border-green-300 bg-green-50 text-green-700",
  POST: "border-yellow-300 bg-yellow-50 text-yellow-700",
  PUT: "border-blue-300 bg-blue-50 text-blue-700",
  PATCH: "border-purple-300 bg-purple-50 text-purple-700",
  PUT_MANY: "border-blue-300 bg-blue-50 text-blue-700",
  PATCH_MANY: "border-purple-300 bg-purple-50 text-purple-700",
  DELETE: "border-red-300 bg-red-50 text-red-700",
};

function deriveEndpoint(editing: Endpoint | undefined, schemas: DataSchema[]) {
  if (!editing) {
    return {
      name: "",
      slug: "",
      schemaId: "",
      methods: [...METHODS] as HttpMethod[],
      readable: [] as string[],
      writable: [] as string[],
    };
  }
  const schema = schemas.find((s) => s.id === editing.schemaId);
  const all = schema?.fields.map((f) => f.name) ?? [];
  return {
    name: editing.name,
    slug: editing.slug,
    schemaId: editing.schemaId,
    methods: editing.methods,
    // Stored [] means "all fields" — expand it so every checkbox shows as selected.
    readable: editing.readableFields.length === 0 ? all : editing.readableFields,
    writable: editing.writableFields.length === 0 ? all : editing.writableFields,
  };
}

export function EndpointFormModal({
  editing,
  onClose,
  schemas,
}: {
  editing?: Endpoint;
  onClose: () => void;
  schemas: DataSchema[];
}) {
  const { t } = useTranslation();
  const create = useCreateEndpoint();
  const update = useUpdateEndpoint();
  const isEdit = !!editing;
  const init = deriveEndpoint(editing, schemas);

  const [name, setName] = useState(init.name);
  const [slug, setSlug] = useState(init.slug);
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [schemaId, setSchemaId] = useState(init.schemaId);
  const [methods, setMethods] = useState<HttpMethod[]>(init.methods);
  const [readable, setReadable] = useState<string[]>(init.readable);
  const [writable, setWritable] = useState<string[]>(init.writable);
  const [error, setError] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;
  const selectedSchema = schemas.find((s) => s.id === schemaId);
  const schemaFields = selectedSchema?.fields.map((f) => f.name) ?? [];

  function pickSchema(id: string) {
    setSchemaId(id);
    const s = schemas.find((x) => x.id === id);
    const names = s?.fields.map((f) => f.name) ?? [];
    // Default to all fields readable & writable; the user can narrow this.
    setReadable(names);
    setWritable(names);
  }

  function toggle<T>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!schemaId) {
      setError(t("endpoints.modal.selectSchemaError"));
      return;
    }
    // Guard the ambiguous "zero fields selected" state. An empty list is stored
    // as [] which the API treats as the "all fields" sentinel — the opposite of
    // intent. Require at least one field for whichever verbs are enabled, and
    // steer users to the Methods toggles to disable a verb entirely.
    const hasRead = methods.some((m) => m === "GET_MANY" || m === "GET");
    const hasWrite = methods.some((m) => m !== "GET_MANY" && m !== "GET");
    if (hasRead && readable.length === 0) {
      setError(t("endpoints.modal.readableRequired"));
      return;
    }
    if (hasWrite && writable.length === 0) {
      setError(t("endpoints.modal.writableRequired"));
      return;
    }
    // Collapse to [] only when ALL fields are selected, so the endpoint
    // auto-tracks fields added to the schema later; otherwise send the subset.
    const allSelected = (sel: string[]) =>
      schemaFields.length > 0 && sel.length === schemaFields.length;
    const payload = {
      name,
      slug: slug || slugify(name),
      schemaId,
      methods,
      readableFields: allSelected(readable) ? [] : readable,
      writableFields: allSelected(writable) ? [] : writable,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: editing!.id, ...payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWentWrong"));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t("endpoints.modal.editTitle") : t("endpoints.modal.newTitle")}
      description={t("endpoints.modal.description")}
      widthClass="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("common.name")}</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder={t("endpoints.modal.namePlaceholder")}
              required
            />
          </div>
          <div>
            <Label>{t("endpoints.modal.slugUrl")}</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder={t("endpoints.modal.slugPlaceholder")}
              className="font-mono"
              required
            />
          </div>
        </div>

        <div>
          <Label>{t("common.schema")}</Label>
          <Select value={schemaId} onChange={(e) => pickSchema(e.target.value)} required>
            <option value="" disabled>
              {t("endpoints.modal.selectSchema")}
            </option>
            {schemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>{t("endpoints.modal.allowedMethods")}</Label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => {
              const on = methods.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggle(methods, m, setMethods)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-sm font-medium font-mono transition " +
                    (on
                      ? activeMethodClasses[m]
                      : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50")
                  }
                >
                  {methodLabels[m]}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSchema && (
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldPicker
              title={t("endpoints.modal.readableFields")}
              hint={t("endpoints.modal.readableHint")}
              all={schemaFields}
              selected={readable}
              onToggle={(f) => toggle(readable, f, setReadable)}
            />
            <FieldPicker
              title={t("endpoints.modal.writableFields")}
              hint={t("endpoints.modal.writableHint")}
              all={schemaFields}
              selected={writable}
              onToggle={(f) => toggle(writable, f, setWritable)}
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending || methods.length === 0}>
            {pending && <Spinner />}
            {isEdit ? t("common.saveChanges") : t("endpoints.modal.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FieldPicker({
  title,
  hint,
  all,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  all: string[];
  selected: string[];
  onToggle: (field: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-400">{hint}</p>
      <div className="mt-2 space-y-1.5">
        {all.map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={selected.includes(f)} onChange={() => onToggle(f)} />
            <span className="font-mono">{f}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
