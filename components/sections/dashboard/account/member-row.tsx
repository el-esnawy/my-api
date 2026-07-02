"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateMemberRole, useRemoveMember } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/util";
import type { Member, OrgRole } from "@/lib/client/types";
import { Card } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Select } from "@/components/atoms/select";
import { ErrorText } from "@/components/atoms/error-text";
import { ConfirmModal } from "@/components/molecules/confirm-modal";

const ROLE_TONES: Record<OrgRole, "purple" | "blue" | "slate"> = {
  owner: "purple",
  admin: "blue",
  member: "slate",
};

export function MemberRow({
  member,
  isSelf,
  canManage,
}: {
  member: Member;
  isSelf: boolean;
  canManage: boolean;
}) {
  const { t, i18n } = useTranslation();
  const updateRole = useUpdateMemberRole();
  const remove = useRemoveMember();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onRoleChange(role: OrgRole) {
    setError(null);
    try {
      await updateRole.mutateAsync({ id: member.id, role });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("account.team.roleChangeFailed"));
    }
  }

  async function onRemove() {
    setError(null);
    try {
      await remove.mutateAsync(member.id);
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("account.team.removeFailed"));
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{member.name || member.email}</span>
            {isSelf && <Badge tone="slate">{t("account.team.you")}</Badge>}
          </div>
          {member.name && <p className="text-sm text-slate-500">{member.email}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {t("common.created", { date: formatDate(member.createdAt, i18n.language) })}
          </p>
          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <Select
              aria-label={t("account.team.roleAria")}
              className="w-32"
              value={member.role}
              disabled={updateRole.isPending}
              onChange={(e) => onRoleChange(e.target.value as OrgRole)}
              options={[
                { value: "owner", label: t("account.roles.owner") },
                { value: "admin", label: t("account.roles.admin") },
                { value: "member", label: t("account.roles.member") },
              ]}
            />
          ) : (
            <Badge tone={ROLE_TONES[member.role]}>{t(`account.roles.${member.role}`)}</Badge>
          )}
          {canManage && !isSelf && (
            <Button
              size="sm"
              variant="dangerGhost"
              onClick={() => setConfirmOpen(true)}
              disabled={remove.isPending}
            >
              {t("account.team.remove")}
            </Button>
          )}
        </div>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title={t("account.team.remove")}
        description={t("account.team.removeConfirm", { name: member.name || member.email })}
        confirmLabel={t("account.team.remove")}
        pending={remove.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onRemove}
      />
    </>
  );
}
