"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DataSchema } from "@/lib/client/types";
import { ToastStack, type ToastData } from "@/components/molecules/toast";
import { EntriesSchemaList } from "@/components/sections/entries/entries-schema-list";
import { EntriesEditor } from "@/components/sections/entries/entries-editor";

export default function EntriesPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<DataSchema | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  const pushToast = useCallback(
    (message: string, tone: ToastData["tone"]) => {
      toastId.current += 1;
      setToasts((prev) => [...prev, { id: toastId.current, message, tone }]);
    },
    []
  );
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div>
      {selected ? (
        <EntriesEditor
          schema={selected}
          onBack={() => setSelected(null)}
          onToast={pushToast}
        />
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("entries.title")}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("entries.description")}
            </p>
          </div>
          <div className="mt-6">
            <EntriesSchemaList onSelect={setSelected} />
          </div>
        </>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
