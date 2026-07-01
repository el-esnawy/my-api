'use client';

import { useState } from 'react';
import { useCreateSchema, useUpdateSchema } from '@/lib/client/hooks';
import { ApiError } from '@/lib/client/api';
import { slugify } from '@/lib/client/util';
import type { DataSchema, FieldType } from '@/lib/client/types';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select } from '@/components/atoms/select';
import { Checkbox } from '@/components/atoms/checkbox';
import { ErrorText } from '@/components/atoms/error-text';
import { Spinner } from '@/components/atoms/spinner';
import { CloseIcon } from '@/components/atoms/icons/close-icon';

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean', 'date'];

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
  name: '',
  type: 'string',
  required: false,
  unique: false,
  enumValues: null
});

function draftFromSchema(s?: DataSchema): {
  name: string;
  slug: string;
  fields: DraftField[];
} {
  if (!s) return { name: '', slug: '', fields: [emptyField()] };
  return {
    name: s.name,
    slug: s.slug,
    fields: s.fields.length
      ? s.fields.map((f) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          unique: f.unique,
          enumValues: f.enumValues ?? null
        }))
      : [emptyField()]
  };
}

export function SchemaFormModal({ editing, onClose }: { editing?: DataSchema; onClose: () => void }) {
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
        // Only include enumValues when present (zod treats it as optional, not nullable).
        ...(f.enumValues && f.enumValues.length ? { enumValues: f.enumValues } : {})
      }))
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
        setError('Something went wrong');
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit schema' : 'New schema'}
      description='Describe a data type with typed fields.'
    >
      <form
        onSubmit={onSubmit}
        className='space-y-4'
      >
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder='Note'
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
              placeholder='note'
              required
              className='font-mono'
            />
          </div>
        </div>

        <div>
          <div className='flex items-center justify-between'>
            <Label className='mb-0'>Fields</Label>
            <button
              type='button'
              onClick={() => setFields((p) => [...p, emptyField()])}
              className='text-sm font-medium text-indigo-600 hover:text-indigo-500'
            >
              + Add field
            </button>
          </div>

          <div className='mt-2 space-y-2'>
            {fields.map((field, i) => (
              <div
                key={i}
                className='flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2'
              >
                <Input
                  value={field.name}
                  onChange={(e) => updateField(i, { name: e.target.value })}
                  placeholder='field_name'
                  className='h-9 flex-1 font-mono'
                  required
                />
                <Select
                  value={field.type}
                  onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                  className='h-9 w-28'
                >
                  {FIELD_TYPES.map((t) => (
                    <option
                      key={t}
                      value={t}
                    >
                      {t}
                    </option>
                  ))}
                </Select>
                <label className='flex items-center gap-1.5 text-xs text-slate-600'>
                  <Checkbox
                    checked={field.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                  />
                  required
                </label>
                <label className='flex items-center gap-1.5 text-xs text-slate-600'>
                  <Checkbox
                    checked={field.unique}
                    onChange={(e) => updateField(i, { unique: e.target.checked })}
                  />
                  unique
                </label>
                <button
                  type='button'
                  onClick={() => setFields((p) => p.filter((_, idx) => idx !== i))}
                  disabled={fields.length === 1}
                  className='rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30'
                  aria-label='Remove field'
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ))}
          </div>
          {fieldErrors.fields && <ErrorText>{fieldErrors.fields}</ErrorText>}
        </div>

        {isEdit && (
          <p className='rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500'>
            Editing fields won&apos;t change records already stored. Removing a field just hides it from future reads
            and writes.
          </p>
        )}

        {error && <div className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</div>}

        <div className='flex justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant='secondary'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={pending}
          >
            {pending && <Spinner />}
            {isEdit ? 'Save changes' : 'Create schema'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
