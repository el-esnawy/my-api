"use client";

import { useState } from "react";
import type { ImportResult } from "@/lib/client/types";
import { Modal } from "@/components/molecules/modal";
import { Button } from "@/components/atoms/button";
import { DownloadIcon } from "@/components/atoms/icons/download-icon";

/**
 * Shown after an import that rejected at least one entry. The rejected
 * entries exist ONLY in this dialog's memory — they are not stored anywhere —
 * so the download is a one-time offer, and the copy says so explicitly.
 */
export function ImportResultModal({
  result,
  onClose,
}: {
  result: ImportResult;
  onClose: () => void;
}) {
  const [downloaded, setDownloaded] = useState(false);

  function downloadRejected() {
    // Each rejected entry keeps its original shape plus an `_importErrors`
    // note; unknown fields are dropped on re-import, so the file can be fixed
    // and uploaded again as-is.
    const payload = result.rejected.map((r) => ({
      ...r.entry,
      _importErrors: r.reasons,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rejected-entries.json";
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={result.imported > 0 ? "Import partially completed" : "Import failed"}
      widthClass="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          Imported <strong>{result.imported}</strong> of <strong>{result.total}</strong>{" "}
          entries. <strong>{result.rejected.length}</strong>{" "}
          {result.rejected.length === 1 ? "entry was" : "entries were"} rejected.
        </p>

        <div className="scroll-thin max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          {result.rejected.map((r) => (
            <div key={r.index} className="text-sm">
              <span className="font-mono text-slate-500">#{r.index + 1}</span>{" "}
              <span className="text-red-700">{r.reasons.join("; ")}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The rejected entries are only available right now — once you close this dialog
          they cannot be retrieved. Download them to fix and re-import later.
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={downloadRejected}>
            <DownloadIcon size={16} />
            {downloaded ? "Downloaded ✓ (download again)" : "Download rejected entries"}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
