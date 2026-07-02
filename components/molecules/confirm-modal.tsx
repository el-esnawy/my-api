"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "./modal";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/atoms/spinner";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  pending = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={pending ? () => {} : onCancel}
      title={title}
      description={description}
      widthClass="max-w-md"
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {pending && <Spinner />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
