"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccountProfile, useInvites, useMembers, useUpdateOrganization } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { Button } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Spinner } from "@/components/atoms/spinner";
import { EmptyState } from "@/components/molecules/empty-state";
import { MemberRow } from "@/components/sections/dashboard/account/member-row";
import { InviteRow } from "@/components/sections/dashboard/account/invite-row";
import { InviteModal } from "@/components/sections/dashboard/account/invite-modal";
import { ToastStack, type ToastData } from "@/components/molecules/toast";

export default function TeamPage() {
  const { t } = useTranslation();
  const { data: profile } = useAccountProfile();
  const { data: members, isLoading: membersLoading } = useMembers();
  const canManage = profile?.role === "owner" || profile?.role === "admin";
  const { data: invites, isLoading: invitesLoading } = useInvites();
  const updateOrg = useUpdateOrganization();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    if (profile) setOrgName(profile.organization.name);
  }, [profile]);

  const pushToast = useCallback((message: string, tone: ToastData["tone"]) => {
    toastId.current += 1;
    setToasts((prev) => [...prev, { id: toastId.current, message, tone }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  async function onSaveOrgName() {
    try {
      await updateOrg.mutateAsync(orgName);
      pushToast(t("account.team.orgNameSaved"), "success");
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : t("account.team.orgNameSaveFailed"), "error");
    }
  }

  return (
    <div>
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <h2 className="font-semibold text-slate-900">{t("account.tabs.team")}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{t("account.team.description")}</p>
          </div>
          {canManage && <Button onClick={() => setInviteOpen(true)}>{t("account.team.invite")}</Button>}
        </div>

        {canManage && profile && (
          <div className="mt-5 flex flex-col gap-2 sm:max-w-xl sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="orgName">{t("account.team.orgNameLabel")}</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <Button
              variant="secondary"
              onClick={onSaveOrgName}
              disabled={!orgName || orgName === profile.organization.name || updateOrg.isPending}
            >
              {updateOrg.isPending && <Spinner />}
              {t("account.team.orgNameSave")}
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase text-slate-400">
          {t("account.team.membersTitle")}
        </h2>
        <div className="mt-3 space-y-3">
          {membersLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Spinner /> {t("common.loading")}
            </div>
          ) : (
            (members ?? []).map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.userId === profile?.user.id}
                canManage={!!canManage}
              />
            ))
          )}
        </div>
      </div>

      {canManage && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase text-slate-400">
            {t("account.team.invitesTitle")}
          </h2>
          <div className="mt-3 space-y-3">
            {invitesLoading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Spinner /> {t("common.loading")}
              </div>
            ) : !invites || invites.filter((i) => i.status === "pending").length === 0 ? (
              <EmptyState title={t("account.team.noInvites")} description="" />
            ) : (
              invites
                .filter((i) => i.status === "pending")
                .map((invite) => <InviteRow key={invite.id} invite={invite} />)
            )}
          </div>
        </div>
      )}

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
