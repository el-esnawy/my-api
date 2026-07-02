'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteEndpoint } from '@/lib/client/hooks';
import { ApiError } from '@/lib/client/api';
import { appBaseUrl } from '@/lib/client/util';
import type { DataSchema, Endpoint, HttpMethod } from '@/lib/client/types';
import { Card } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { ErrorText } from '@/components/atoms/error-text';
import { ConfirmModal } from '@/components/molecules/confirm-modal';
import { CopyButton } from '@/components/molecules/copy-button';
import { EndpointFieldList } from './endpoint-field-list';

const methodTone: Record<HttpMethod, 'green' | 'yellow' | 'blue' | 'purple' | 'red'> = {
  GET_MANY: 'green',
  GET: 'green',
  POST: 'yellow',
  PUT: 'blue',
  PATCH: 'purple',
  PUT_MANY: 'blue',
  PATCH_MANY: 'purple',
  DELETE: 'red'
};

const methodLabels: Record<HttpMethod, string> = {
  GET_MANY: 'GET many',
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  PUT_MANY: 'PUT many',
  PATCH_MANY: 'PATCH many',
  DELETE: 'DELETE'
};

const singleRecordMethods = new Set<HttpMethod>(['GET', 'PUT', 'PATCH', 'DELETE']);

export function EndpointCard({
  endpoint,
  schema,
  onEdit
}: {
  endpoint: Endpoint;
  schema?: DataSchema;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const del = useDeleteEndpoint();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const url = `${appBaseUrl()}/api/v1/${endpoint.slug}`;
  const methodUrl = (method: HttpMethod) => (singleRecordMethods.has(method) ? `${url}/:id` : url);

  async function onDelete() {
    setError(null);
    try {
      await del.mutateAsync(endpoint.id);
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('endpoints.deleteFailed'));
    }
  }

  return (
    <>
      <Card className='p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h3 className='font-semibold text-slate-900'>{endpoint.name}</h3>
            <p className='mt-0.5 text-sm text-slate-500'>
              {t('endpoints.schemaLabel')} <span className='font-mono'>{schema?.slug ?? '—'}</span>
            </p>
          </div>
          <div className='flex items-center gap-1.5'>
            {endpoint.methods.map((m) => (
              <Badge
                key={m}
                tone={methodTone[m]}
                className='font-mono'
              >
                {methodLabels[m]}
              </Badge>
            ))}
          </div>
        </div>

        <div className='mt-4 space-y-2'>
          {endpoint.methods.map((method) => {
            const currentUrl = methodUrl(method);
            return (
              <div
                key={method}
                className='flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2'
              >
                <Badge
                  tone={methodTone[method]}
                  className='font-mono'
                >
                  {methodLabels[method]}
                </Badge>
                <code className='scroll-thin flex-1 overflow-x-auto whitespace-nowrap text-sm text-slate-100'>
                  {currentUrl}
                </code>
                <CopyButton value={currentUrl} />
              </div>
            );
          })}
        </div>

        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          <EndpointFieldList
            label={t('endpoints.readableGet')}
            fields={endpoint.readableFields}
            schema={schema}
          />
          <EndpointFieldList
            label={t('endpoints.writableMethods')}
            fields={endpoint.writableFields}
            schema={schema}
          />
        </div>

        <div className='mt-4 flex items-center justify-between'>
          {error ? <ErrorText>{error}</ErrorText> : <span />}
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='secondary'
              onClick={onEdit}
            >
              {t('common.edit')}
            </Button>
            <Button
              size='sm'
              variant='dangerGhost'
              onClick={() => setConfirmOpen(true)}
              disabled={del.isPending}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Card>
      <ConfirmModal
        open={confirmOpen}
        title={t('common.delete')}
        description={t('endpoints.deleteConfirm', { name: endpoint.name })}
        confirmLabel={t('common.delete')}
        pending={del.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
}
