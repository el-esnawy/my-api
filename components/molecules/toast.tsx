"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/client/util";

export interface ToastData {
  id: number;
  message: string;
  tone: "success" | "warning" | "error";
}

const tones: Record<ToastData["tone"], string> = {
  success: "border-green-200 bg-green-50 text-green-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100",
};

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: number) => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
        tones[toast.tone]
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="font-semibold opacity-60 transition hover:opacity-100"
        aria-label={t("common.dismiss")}
      >
        ✕
      </button>
    </div>
  );
}

/** Fixed bottom-right toast stack. Render once per page with local state. */
export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
