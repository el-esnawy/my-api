'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean', 'date', 'enum'];

interface DraftField {
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  enumValues: string[] | null;
}

const emptyField = (): DraftField => ({
  name: '',
  type: 'string',
  required: false,
  unique: false,
  enumValues: []
});

function normalizeEnumValues(values: string[] | null | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

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
          enumValues:
            f.type === 'enum'
              ? f.enumValues && f.enumValues.length > 0
                ? f.enumValues
                : ['']
              : []
        }))
      : [emptyField()]
  };
}

export function SchemaFormModal({ editing, onClose }: { editing?: DataSchema; onClose: () => void }) {
  const { t } = useTranslation();
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

  function updateFieldType(i: number, type: FieldType) {
    setFields((prev) =>
      prev.map((field, idx) =>
        idx === i
          ? {
              ...field,
              type,
              enumValues:
                type === 'enum'
                  ? field.enumValues && field.enumValues.length > 0
                    ? field.enumValues
                    : ['']
                  : []
            }
          : field
      )
    );
  }

  function updateEnumValue(fieldIndex: number, valueIndex: number, value: string) {
    setFields((prev) =>
      prev.map((field, idx) =>
        idx === fieldIndex
          ? {
              ...field,
              enumValues: (field.enumValues?.length ? field.enumValues : ['']).map((item, optionIdx) =>
                optionIdx === valueIndex ? value : item
              )
            }
          : field
      )
    );
  }

  function addEnumValue(fieldIndex: number) {
    setFields((prev) =>
      prev.map((field, idx) =>
        idx === fieldIndex
          ? { ...field, enumValues: [...(field.enumValues ?? []), ''] }
          : field
      )
    );
  }

  function removeEnumValue(fieldIndex: number, valueIndex: number) {
    setFields((prev) =>
      prev.map((field, idx) =>
        idx === fieldIndex
          ? {
              ...field,
              enumValues: (field.enumValues ?? []).filter((_, optionIdx) => optionIdx !== valueIndex)
            }
          : field
      )
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const payload = {
      name,
      slug: slug || slugify(name),
      fields: fields.map((f) => {
        const enumValues = normalizeEnumValues(f.enumValues);
        return {
          name: f.name,
          type: f.type,
          required: f.required,
          unique: f.unique,
          ...(f.type === 'enum' ? { enumValues } : {})
        };
      })
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
        setError(t('common.somethingWentWrong'));
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('schemas.modal.editTitle') : t('schemas.modal.newTitle')}
      description={t('schemas.modal.description')}
    >
      <form
        onSubmit={onSubmit}
        className='space-y-4'
      >
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <Label>{t('common.name')}</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder={t('schemas.modal.namePlaceholder')}
              required
            />
          </div>
          <div>
            <Label>{t('common.slug')}</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder={t('schemas.modal.slugPlaceholder')}
              required
              className='font-mono'
            />
          </div>
        </div>

        <div>
          <div className='flex items-center justify-between'>
            <Label className='mb-0'>{t('schemas.modal.fields')}</Label>
            <button
              type='button'
              onClick={() => setFields((p) => [...p, emptyField()])}
              className='text-sm font-medium text-indigo-600 hover:text-indigo-500'
            >
              {t('schemas.modal.addField')}
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
                  placeholder={t('schemas.modal.fieldNamePlaceholder')}
                  className='h-9 flex-1 font-mono'
                  required
                />
                <Select
                  value={field.type}
                  onChange={(e) => updateFieldType(i, e.target.value as FieldType)}
                  className='h-9 w-32'
                >
                  {FIELD_TYPES.map((fieldType) => (
                    <option
                      key={fieldType}
                      value={fieldType}
                    >
                      {t(`common.fieldTypes.${fieldType}`)}
                    </option>
                  ))}
                </Select>
                <label className='flex items-center gap-1.5 text-xs text-slate-600'>
                  <Checkbox
                    checked={field.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                  />
                  {t('common.required')}
                </label>
                <label className='flex items-center gap-1.5 text-xs text-slate-600'>
                  <Checkbox
                    checked={field.unique}
                    onChange={(e) => updateField(i, { unique: e.target.checked })}
                  />
                  {t('common.unique')}
                </label>
                <button
                  type='button'
                  onClick={() => setFields((p) => p.filter((_, idx) => idx !== i))}
                  disabled={fields.length === 1}
                  className='rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30'
                  aria-label={t('schemas.modal.removeField')}
                >
                  <CloseIcon size={16} />
                </button>
                {field.type === 'enum' && (
                  <div className='w-full border-t border-slate-200 pt-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='text-xs font-medium text-slate-500'>
                        {t('schemas.modal.enumValues')}
                      </span>
                      <button
                        type='button'
                        onClick={() => addEnumValue(i)}
                        className='text-xs font-medium text-indigo-600 transition hover:text-indigo-500'
                      >
                        {t('schemas.modal.addEnumValue')}
                      </button>
                    </div>
                    <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                      {(field.enumValues?.length ? field.enumValues : ['']).map((enumValue, valueIndex) => (
                        <div
                          key={valueIndex}
                          className='flex items-center gap-1.5'
                        >
                          <Input
                            value={enumValue}
                            onChange={(e) => updateEnumValue(i, valueIndex, e.target.value)}
                            placeholder={t('schemas.modal.enumValuePlaceholder')}
                            className='h-9 font-mono'
                            required
                          />
                          <button
                            type='button'
                            onClick={() => removeEnumValue(i, valueIndex)}
                            disabled={(field.enumValues?.length ?? 0) <= 1}
                            className='rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30'
                            aria-label={t('schemas.modal.removeEnumValue')}
                          >
                            <CloseIcon size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {(fieldErrors[`fields.${i}.enumValues`] || fieldErrors[`fields.${i}.enumValues.0`]) && (
                      <ErrorText>
                        {fieldErrors[`fields.${i}.enumValues`] ?? fieldErrors[`fields.${i}.enumValues.0`]}
                      </ErrorText>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {fieldErrors.fields && <ErrorText>{fieldErrors.fields}</ErrorText>}
        </div>

        {isEdit && (
          <p className='rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500'>
            {t('schemas.modal.editWarning')}
          </p>
        )}

        {error && <div className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</div>}

        <div className='flex justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant='secondary'
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            disabled={pending}
          >
            {pending && <Spinner />}
            {isEdit ? t('common.saveChanges') : t('schemas.modal.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
