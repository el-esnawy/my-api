"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onStay}
      title={t("entries.unsaved.title")}
      description={t("entries.unsaved.description")}
      widthClass="max-w-md"
    >
      <p className="text-sm text-slate-600">
        {t("entries.unsaved.body")}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onStay}>
          {t("entries.unsaved.stay")}
        </Button>
        <Button variant="danger" onClick={onLeave}>
          {t("entries.unsaved.leave")}
        </Button>
      </div>
    </Modal>
  );
}
