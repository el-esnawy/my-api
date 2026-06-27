"use client";

import { useState } from "react";
import {
  useSchemas,
  useCreateSchema,
  useUpdateSchema,
  useDeleteSchema,
} from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { slugify, formatDate } from "@/lib/client/util";
import type { DataSchema, FieldType } from "@/lib/client/types";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorText,
  Input,
  Label,
  Select,
  Spinner,
} from "@/components/ui";

const FIELD_TYPES: FieldType[] = ["string", "number", "boolean", "date"];

interface DraftField {
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  // Carried through edits even though the builder has no enum editor yet, so a
  // schema created with enum constraints (e.g. via the API) isn't silently wiped.
  enumValues: string[] | null;
}

const emptyField = (): DraftField => ({
  name: "",
  type: "string",
  required: false,
  unique: false,
  enumValues: null,
});

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

function SchemaCard({
  schema,
  onEdit,
}: {
  schema: DataSchema;
  onEdit: () => void;
}) {
  const del = useDeleteSchema();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!confirm(`Delete schema "${schema.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await del.mutateAsync(schema.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{schema.name}</h3>
          <Badge tone="indigo" className="mt-1 font-mono">
            {schema.slug}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="Edit schema"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onDelete}
            disabled={del.isPending}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Delete schema"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {schema.fields.map((f) => (
          <div
            key={f.name}
            className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm"
          >
            <span className="font-mono text-slate-700">{f.name}</span>
            <span className="flex items-center gap-1.5">
              <Badge>{f.type}</Badge>
              {f.required && <Badge tone="amber">required</Badge>}
              {f.unique && <Badge tone="green">unique</Badge>}
            </span>
          </div>
        ))}
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      <p className="mt-4 text-xs text-slate-400">Created {formatDate(schema.createdAt)}</p>
    </Card>
  );
}

function draftFromSchema(s?: DataSchema): {
  name: string;
  slug: string;
  fields: DraftField[];
} {
  if (!s) return { name: "", slug: "", fields: [emptyField()] };
  return {
    name: s.name,
    slug: s.slug,
    fields: s.fields.length
      ? s.fields.map((f) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          unique: f.unique,
          enumValues: f.enumValues ?? null,
        }))
      : [emptyField()],
  };
}

function SchemaFormModal({
  editing,
  onClose,
}: {
  editing?: DataSchema;
  onClose: () => void;
}) {
  const create = useCreateSchema();
  const update = useUpdateSchema();
  const isEdit = !!editing;
  const init = draftFromSchema(editing);

  const [name, setName] = useState(init.name);
  const [slug, setSlug] = useState(init.slug);
  // When editing, the slug is already set — don't let typing the name overwrite it.
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [fields, setFields] = useState<DraftField[]>(init.fields);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const pending = create.isPending || update.isPending;

  function updateField(i: number, patch: Partial<DraftField>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const payload = {
      name,
      slug: slug || slugify(name),
      fields: fields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        unique: f.unique,
      })),
    };
    try {
      if (isEdit) await update.mutateAsync({ id: editing!.id, ...payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError("Something went wrong");
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit schema" : "New schema"}
      description="Describe a data type with typed fields."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder="Note"
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="note"
              required
              className="font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="mb-0">Fields</Label>
            <button
              type="button"
              onClick={() => setFields((p) => [...p, emptyField()])}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add field
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {fields.map((field, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
              >
                <Input
                  value={field.name}
                  onChange={(e) => updateField(i, { name: e.target.value })}
                  placeholder="field_name"
                  className="h-9 flex-1 font-mono"
                  required
                />
                <Select
                  value={field.type}
                  onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                  className="h-9 w-28"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Checkbox
                    checked={field.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                  />
                  req
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Checkbox
                    checked={field.unique}
                    onChange={(e) => updateField(i, { unique: e.target.checked })}
                  />
                  unique
                </label>
                <button
                  type="button"
                  onClick={() => setFields((p) => p.filter((_, idx) => idx !== i))}
                  disabled={fields.length === 1}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove field"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {fieldErrors.fields && <ErrorText>{fieldErrors.fields}</ErrorText>}
        </div>

        {isEdit && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Editing fields won&apos;t change records already stored. Removing a field just
            hides it from future reads and writes.
          </p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {isEdit ? "Save changes" : "Create schema"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
