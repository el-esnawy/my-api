"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DataSchema, SchemaField } from "@/lib/client/types";
import { Modal } from "@/components/molecules/modal";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select } from "@/components/atoms/select";
import { Checkbox } from "@/components/atoms/checkbox";
import { ErrorText } from "@/components/atoms/error-text";

/** ISO date string → value usable by <input type="datetime-local"> (local time). */
function isoToLocalInput(iso: unknown): string {
  if (typeof iso !== "string" && !(iso instanceof Date)) return "";
  const d = new Date(iso as string);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialFormState(schema: DataSchema, data?: Record<string, unknown>) {
  const state: Record<string, string | boolean> = {};
  for (const field of schema.fields) {
    const value = data?.[field.name];
    if (field.type === "boolean") state[field.name] = value === true;
    else if (field.type === "date") state[field.name] = isoToLocalInput(value);
    else state[field.name] = value === undefined || value === null ? "" : String(value);
  }
  return state;
}

/** Build the entry data object from form state; empty optional inputs are omitted. */
function buildData(schema: DataSchema, state: Record<string, string | boolean>) {
  const data: Record<string, unknown> = {};
  for (const field of schema.fields) {
    const raw = state[field.name];
    if (field.type === "boolean") {
      data[field.name] = raw === true;
      continue;
    }
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text === "") continue; // omitted — server enforces required
    if (field.type === "number") data[field.name] = Number(text);
    else if (field.type === "date") data[field.name] = new Date(text).toISOString();
    else data[field.name] = raw as string;
  }
  return data;
}

export function EntryFormModal({
  schema,
  initialData,
  serverErrors,
  onSubmit,
  onClose,
}: {
  schema: DataSchema;
  /** Present when editing an existing/staged entry. */
  initialData?: Record<string, unknown>;
  /** Field errors from a failed batch save, shown inline. */
  serverErrors?: Record<string, string>;
  onSubmit: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [state, setState] = useState(() => initialFormState(schema, initialData));
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string | boolean) {
    setState((prev) => ({ ...prev, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Client-side pass on required fields for immediate feedback; the batch
    // save re-validates everything server-side.
    const errors: Record<string, string> = {};
    for (const field of schema.fields) {
      if (!field.required || field.type === "boolean") continue;
      const raw = state[field.name];
      if (typeof raw !== "string" || raw.trim() === "") {
        errors[field.name] = t("validation.record.required");
      } else if (field.type === "number" && !Number.isFinite(Number(raw.trim()))) {
        errors[field.name] = t("validation.record.number");
      }
    }
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    onSubmit(buildData(schema, state));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t("entries.form.editTitle") : t("entries.form.newTitle")}
      description={t("entries.form.schemaDescription", { name: schema.name })}
      widthClass="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4">
        {schema.fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={state[field.name]}
            error={localErrors[field.name] ?? serverErrors?.[field.name]}
            onChange={(v) => set(field.name, v)}
          />
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit">{isEdit ? t("common.apply") : t("entries.editor.addEntry")}</Button>
        </div>
      </form>
    </Modal>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: SchemaField;
  value: string | boolean;
  error?: string;
  onChange: (value: string | boolean) => void;
}) {
  const { t } = useTranslation();
  const label = (
    <Label>
      <span className="font-mono">{field.name}</span>
      <span className="ml-2 text-xs font-normal text-slate-400">
        {t(`common.fieldTypes.${field.type}`)}
        {field.required && ` · ${t("common.required")}`}
        {field.unique && ` · ${t("common.unique")}`}
      </span>
    </Label>
  );

  if (field.type === "boolean") {
    return (
      <div>
        <label className="flex items-center gap-2">
          <Checkbox checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span className="font-mono text-sm text-slate-700">{field.name}</span>
          <span className="text-xs text-slate-400">{t("common.boolean")}</span>
        </label>
        <ErrorText>{error && `${field.name} ${error}`}</ErrorText>
      </div>
    );
  }

  if (field.enumValues && field.enumValues.length > 0) {
    return (
      <div>
        {label}
        <Select value={value as string} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t("entries.form.noneOption")}</option>
          {field.enumValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
        <ErrorText>{error && `${field.name} ${error}`}</ErrorText>
      </div>
    );
  }

  return (
    <div>
      {label}
      <Input
        type={
          field.type === "number"
            ? "number"
            : field.type === "date"
              ? "datetime-local"
              : "text"
        }
        step={field.type === "number" ? "any" : undefined}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
      />
      <ErrorText>{error && `${field.name} ${error}`}</ErrorText>
    </div>
  );
}
