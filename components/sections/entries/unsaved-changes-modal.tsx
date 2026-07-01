"use client";

import { Modal } from "@/components/molecules/modal";
import { Button } from "@/components/atoms/button";

export function UnsavedChangesModal({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      title="Unsaved changes"
      description="You have unsaved changes in this schema's entries."
      widthClass="max-w-md"
    >
      <p className="text-sm text-slate-600">
        If you leave now, your staged edits will be discarded. Save your changes first to
        keep them.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onStay}>
          Stay
        </Button>
        <Button variant="danger" onClick={onLeave}>
          Discard &amp; leave
        </Button>
      </div>
    </Modal>
  );
}
