"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import type {
  AccessToken,
  DataSchema,
  Endpoint,
  Entry,
  ImportResult,
  Invite,
  Member,
  Organization,
  Plan,
  OrgRole,
  TokenGrant,
  User,
} from "./types";

export const keys = {
  me: ["me"] as const,
  schemas: ["schemas"] as const,
  endpoints: ["endpoints"] as const,
  tokens: ["tokens"] as const,
  entryCounts: ["entries", "counts"] as const,
  entries: (schemaId: string) => ["entries", schemaId] as const,
  account: {
    organization: ["account", "organization"] as const,
    members: ["account", "members"] as const,
    invites: ["account", "invites"] as const,
  },
};

// --- Auth ---
export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<{ user: User }>("/api/auth/me").then((r) => r.user),
    retry: false,
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<{ user: User }>("/api/auth/sign-in", { method: "POST", json: input }),
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      confirmPassword: string;
      name?: string;
    }) => api<{ user: User }>("/api/auth/sign-up", { method: "POST", json: input }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/auth/sign-out", { method: "POST" }),
    onSuccess: () => qc.clear(),
  });
}

// --- Schemas ---
export function useSchemas() {
  return useQuery({
    queryKey: keys.schemas,
    queryFn: () =>
      api<{ schemas: DataSchema[] }>("/api/schemas").then((r) => r.schemas),
  });
}

export function useCreateSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<{ schema: DataSchema }>("/api/schemas", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.schemas }),
  });
}

export function useUpdateSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, unknown>) =>
      api<{ schema: DataSchema }>(`/api/schemas/${id}`, { method: "PUT", json: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.schemas });
      // Endpoints reference schema fields, so refresh them too.
      qc.invalidateQueries({ queryKey: keys.endpoints });
    },
  });
}

export function useDeleteSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/schemas/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.schemas }),
  });
}

// --- Endpoints ---
export function useEndpoints() {
  return useQuery({
    queryKey: keys.endpoints,
    queryFn: () =>
      api<{ endpoints: Endpoint[] }>("/api/endpoints").then((r) => r.endpoints),
  });
}

export function useCreateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<{ endpoint: Endpoint }>("/api/endpoints", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.endpoints }),
  });
}

export function useUpdateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, unknown>) =>
      api<{ endpoint: Endpoint }>(`/api/endpoints/${id}`, { method: "PUT", json: input }),
    onSuccess: (data) => {
      qc.setQueryData<Endpoint[]>(keys.endpoints, (endpoints) =>
        endpoints?.map((endpoint) =>
          endpoint.id === data.endpoint.id ? data.endpoint : endpoint
        )
      );
      qc.invalidateQueries({ queryKey: keys.endpoints });
      qc.invalidateQueries({ queryKey: keys.tokens });
    },
  });
}

export function useDeleteEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/endpoints/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.endpoints });
      // grants may have changed
      qc.invalidateQueries({ queryKey: keys.tokens });
    },
  });
}

// --- Tokens ---
export function useTokens() {
  return useQuery({
    queryKey: keys.tokens,
    queryFn: () =>
      api<{ tokens: AccessToken[] }>("/api/tokens").then((r) => r.tokens),
  });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; grants: TokenGrant[] }) =>
      api<{ token: AccessToken; plaintext: string }>("/api/tokens", {
        method: "POST",
        json: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tokens }),
  });
}

export function useUpdateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Record<string, unknown>) =>
      api<{ token: AccessToken }>(`/api/tokens/${id}`, {
        method: "PATCH",
        json: patch,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tokens }),
  });
}

export function useDeleteToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/tokens/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tokens }),
  });
}

// --- Entries ---
export function useEntryCounts() {
  return useQuery({
    queryKey: keys.entryCounts,
    queryFn: () =>
      api<{ counts: Record<string, number> }>("/api/entries/counts").then((r) => r.counts),
  });
}

export function useEntries(schemaId: string | null) {
  return useQuery({
    queryKey: keys.entries(schemaId ?? "none"),
    queryFn: () =>
      api<{ entries: Entry[]; truncated: boolean }>(
        `/api/schemas/${schemaId}/entries`
      ).then((r) => r.entries),
    enabled: !!schemaId,
  });
}

export function useBatchSaveEntries(schemaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      creates: { tempId: string; data: Record<string, unknown> }[];
      updates: { id: string; data: Record<string, unknown> }[];
      deletes: string[];
    }) =>
      api<{ created: number; updated: number; deleted: number }>(
        `/api/schemas/${schemaId}/entries/batch`,
        { method: "POST", json: input }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.entries(schemaId) });
      qc.invalidateQueries({ queryKey: keys.entryCounts });
    },
  });
}

export function useImportEntries(schemaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: Record<string, unknown>[]) =>
      api<ImportResult>(`/api/schemas/${schemaId}/entries/import`, {
        method: "POST",
        json: { entries },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.entries(schemaId) });
      qc.invalidateQueries({ queryKey: keys.entryCounts });
    },
  });
}

/** On-demand reveal of a token's plaintext (decrypted server-side, per request). */
export function useRevealToken() {
  return useMutation({
    mutationFn: (id: string) =>
      api<{ token: string }>(`/api/tokens/${id}/reveal`).then((r) => r.token),
  });
}

// --- Account: profile ---
/** Profile + the caller's organization + their role in it, in one round trip. */
export function useAccountProfile() {
  return useQuery({
    queryKey: ["account", "profile"],
    queryFn: () =>
      api<{ user: User; organization: Organization; role: OrgRole }>("/api/account/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; email?: string; currentPassword?: string }) =>
      api<{ user: User }>("/api/account/profile", { method: "PATCH", json: input }),
    onSuccess: (data) => {
      qc.setQueryData(keys.me, data.user);
      qc.invalidateQueries({ queryKey: ["account", "profile"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) => api<{ success: boolean }>("/api/account/password", { method: "POST", json: input }),
  });
}

// --- Account: organization & billing ---
export function useOrganization() {
  return useQuery({
    queryKey: keys.account.organization,
    queryFn: () =>
      api<{ organization: Organization }>("/api/account/organization").then(
        (r) => r.organization
      ),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<{ organization: Organization }>("/api/account/organization", {
        method: "PATCH",
        json: { name },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.account.organization });
      qc.invalidateQueries({ queryKey: ["account", "profile"] });
    },
  });
}

export function useUpgradePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: Plan) =>
      api<{ organization: Organization }>("/api/account/organization/plan", {
        method: "PATCH",
        json: { plan },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.account.organization });
      qc.invalidateQueries({ queryKey: ["account", "profile"] });
    },
  });
}

// --- Account: team members ---
export function useMembers() {
  return useQuery({
    queryKey: keys.account.members,
    queryFn: () => api<{ members: Member[] }>("/api/account/members").then((r) => r.members),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: OrgRole }) =>
      api<{ member: Member }>(`/api/account/members/${id}`, { method: "PATCH", json: { role } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.account.members }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/account/members/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.account.members }),
  });
}

// --- Account: invites ---
export function useInvites() {
  return useQuery({
    queryKey: keys.account.invites,
    queryFn: () => api<{ invites: Invite[] }>("/api/account/invites").then((r) => r.invites),
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: OrgRole }) =>
      api<{ invite: Invite; emailSent: boolean; acceptUrl?: string }>("/api/account/invites", {
        method: "POST",
        json: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.account.invites }),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/account/invites/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.account.invites }),
  });
}

export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ invite: Invite; emailSent: boolean; acceptUrl?: string }>(
        `/api/account/invites/${id}/resend`,
        { method: "POST" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.account.invites }),
  });
}

// --- Invite accept (public) ---
export function useInviteDetails(token: string | null) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () =>
      api<{
        organizationName: string | null;
        inviterEmail: string | null;
        email: string;
        role: OrgRole;
        alreadyHasAccount: boolean;
      }>(`/api/invites/${token}`),
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvite(token: string) {
  return useMutation({
    mutationFn: (input: { name?: string; password?: string; confirmPassword?: string }) =>
      api<{ user: User }>(`/api/invites/${token}`, { method: "POST", json: input }),
  });
}
