"use client";

import { useMemo, useState } from "react";
import {
  useEndpoints,
  useSchemas,
  useCreateEndpoint,
  useUpdateEndpoint,
  useDeleteEndpoint,
} from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { slugify, appBaseUrl } from "@/lib/client/util";
import type { DataSchema, Endpoint, HttpMethod } from "@/lib/client/types";
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
  Select,
  Spinner,
} from "@/components/ui";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const methodTone: Record<HttpMethod, "green" | "indigo" | "amber" | "slate" | "red"> = {
  GET: "green",
  POST: "indigo",
  PUT: "amber",
  PATCH: "amber",
  DELETE: "red",
};

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

function EndpointCard({
  endpoint,
  schema,
  onEdit,
}: {
  endpoint: Endpoint;
  schema?: DataSchema;
  onEdit: () => void;
}) {
  const del = useDeleteEndpoint();
  const [error, setError] = useState<string | null>(null);
  const url = `${appBaseUrl()}/api/v1/${endpoint.slug}`;

  async function onDelete() {
    if (!confirm(`Delete endpoint "${endpoint.name}"? Its stored records will be removed.`)) return;
    setError(null);
    try {
      await del.mutateAsync(endpoint.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{endpoint.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Schema: <span className="font-mono">{schema?.slug ?? "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {endpoint.methods.map((m) => (
            <Badge key={m} tone={methodTone[m]} className="font-mono">
              {m}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
        <code className="scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-slate-100">
          {url}
        </code>
        <CopyButton value={url} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FieldList label="Readable (GET)" fields={endpoint.readableFields} schema={schema} />
        <FieldList label="Writable (POST/PUT/PATCH)" fields={endpoint.writableFields} schema={schema} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        {error ? <ErrorText>{error}</ErrorText> : <span />}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="dangerGhost"
            onClick={onDelete}
            disabled={del.isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FieldList({
  label,
  fields,
  schema,
}: {
  label: string;
  fields: string[];
  schema?: DataSchema;
}) {
  const all = schema ? schema.fields.map((f) => f.name) : [];
  const effective = fields.length === 0 ? all : fields;
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {effective.length === 0 ? (
          <span className="text-sm text-slate-400">none</span>
        ) : (
          effective.map((f) => (
            <Badge key={f} className="font-mono">
              {f}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

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

function EndpointFormModal({
  editing,
  onClose,
  schemas,
}: {
  editing?: Endpoint;
  onClose: () => void;
  schemas: DataSchema[];
}) {
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
      setError("Select a schema");
      return;
    }
    // Guard the ambiguous "zero fields selected" state. An empty list is stored
    // as [] which the API treats as the "all fields" sentinel — the opposite of
    // intent. Require at least one field for whichever verbs are enabled, and
    // steer users to the Methods toggles to disable a verb entirely.
    const hasGet = methods.includes("GET");
    const hasWrite = methods.some((m) => m !== "GET");
    if (hasGet && readable.length === 0) {
      setError("Select at least one readable field, or turn off GET in Methods.");
      return;
    }
    if (hasWrite && writable.length === 0) {
      setError(
        "Select at least one writable field, or turn off the write methods (POST/PUT/PATCH)."
      );
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
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit endpoint" : "New endpoint"}
      description="Expose a schema as a REST resource."
      widthClass="max-w-xl"
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
              placeholder="Notes"
              required
            />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="notes"
              className="font-mono"
              required
            />
          </div>
        </div>

        <div>
          <Label>Schema</Label>
          <Select value={schemaId} onChange={(e) => pickSchema(e.target.value)} required>
            <option value="" disabled>
              Select a schema…
            </option>
            {schemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Allowed methods</Label>
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
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50")
                  }
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSchema && (
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldPicker
              title="Readable fields"
              hint="Returned by GET"
              all={schemaFields}
              selected={readable}
              onToggle={(f) => toggle(readable, f, setReadable)}
            />
            <FieldPicker
              title="Writable fields"
              hint="Accepted by writes"
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
            Cancel
          </Button>
          <Button type="submit" disabled={pending || methods.length === 0}>
            {pending && <Spinner />}
            {isEdit ? "Save changes" : "Create endpoint"}
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
