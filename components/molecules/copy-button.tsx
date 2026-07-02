"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/client/util";
import { CopyIcon } from "@/components/atoms/icons/copy-icon";
import { CheckIcon } from "@/components/atoms/icons/check-icon";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable (e.g. non-secure context) — ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
        className
      )}
    >
      {copied ? (
        <>
          <CheckIcon size={14} />
          {t("common.copied")}
        </>
      ) : (
        <>
          <CopyIcon size={14} />
          {label ?? t("common.copy")}
        </>
      )}
    </button>
  );
}
