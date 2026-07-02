"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useResendInvite, useRevokeInvite } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/util";
import type { Invite } from "@/lib/client/types";
import { Card } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ErrorText } from "@/components/atoms/error-text";

export function InviteRow({ invite }: { invite: Invite }) {
  const { t, i18n } = useTranslation();
  const resend = useResendInvite();
  const revoke = useRevokeInvite();
  const [error, setError] = useState<string | null>(null);

  async function onResend() {
    setError(null);
    try {
      await resend.mutateAsync(invite.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("account.team.resendFailed"));
    }
  }

  async function onRevoke() {
    setError(null);
    try {
      await revoke.mutateAsync(invite.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("account.team.revokeFailed"));
    }
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-500/50">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{invite.email}</span>
          <Badge tone="slate">{t(`account.roles.${invite.role}`)}</Badge>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {t("account.team.expires", { date: formatDate(invite.expiresAt, i18n.language) })}
        </p>
        {error && <ErrorText>{error}</ErrorText>}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onResend} disabled={resend.isPending}>
          {t("account.team.resend")}
        </Button>
        <Button size="sm" variant="dangerGhost" onClick={onRevoke} disabled={revoke.isPending}>
          {t("account.team.revoke")}
        </Button>
      </div>
    </Card>
  );
}
