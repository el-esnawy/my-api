# Frontend Dashboard

The dashboard is a React client UI inside the Next.js App Router. It is built
around small reusable components, TanStack Query hooks, and modal forms.

## Entry Points

| File | Purpose |
| --- | --- |
| `app/layout.tsx` | Root HTML shell, global CSS, and `QueryProvider`. |
| `app/(auth)/layout.tsx` | Shared auth-page layout. |
| `app/(auth)/sign-in/page.tsx` | Sign-in form. |
| `app/(auth)/sign-up/page.tsx` | Sign-up form. |
| `app/(dashboard)/dashboard/layout.tsx` | Dashboard header, tabs, account display, sign-out. |
| `app/(dashboard)/dashboard/page.tsx` | Redirects `/dashboard` to `/dashboard/schemas`. |
| `app/(dashboard)/dashboard/schemas/page.tsx` | Schema list, create/edit/delete modal. |
| `app/(dashboard)/dashboard/endpoints/page.tsx` | Endpoint list, create/edit/delete modal, endpoint URL copy. |
| `app/(dashboard)/dashboard/tokens/page.tsx` | Token list, create/edit/revoke/delete modal, one-time secret reveal. |
| `app/(dashboard)/dashboard/account/layout.tsx` | Account section heading + `AccountNav` sub-tabs (profile/security/billing/team). |
| `app/(dashboard)/dashboard/account/profile/page.tsx` | Name/email edit form (email change requires current password). |
| `app/(dashboard)/dashboard/account/security/page.tsx` | Change-password form. |
| `app/(dashboard)/dashboard/account/billing/page.tsx` | Plan cards (hobby/pro/enterprise), mock upgrade/downgrade. |
| `app/(dashboard)/dashboard/account/team/page.tsx` | Member list + role management, pending invites, invite modal. |
| `app/invite/[token]/page.tsx` | Public invite-accept page — outside `(auth)` on purpose (see dashboard-management-flows.md). |

## Provider Setup

`app/layout.tsx` wraps all pages in `QueryProvider`.

`providers/QueryProvider.tsx` creates one `QueryClient` in React state:

```ts
const [client] = useState(() => new QueryClient({ ... }));
```

Using state ensures the client instance is stable across renders.

Default query behavior:

- data is fresh for 30 seconds,
- failed queries retry once,
- refocusing the browser window does not automatically refetch.

## API Wrapper

File: `lib/client/api.ts`

The `api()` helper wraps `fetch` for dashboard calls.

It always sends:

```ts
credentials: "same-origin"
```

That allows browser requests to include the HTTP-only session cookie.

If a response is not OK, `api()` throws `ApiError` with:

- `message`,
- HTTP `status`,
- raw response `body`,
- optional `fields` validation map.

New dashboard code should use `api()` through hooks rather than calling `fetch`
directly.

## Query Hooks

File: `lib/client/hooks.ts`

The hook file centralizes:

- cache keys,
- query functions,
- mutation functions,
- invalidation rules.

Cache keys:

```ts
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
```

(The account profile query uses the ad-hoc key `["account", "profile"]`
directly rather than living in the `keys` object — it's only read by
`useAccountProfile()`.)

Read hooks:

- `useMe()` — from `/api/auth/me`, just `{id, email, name, createdAt}`.
- `useAccountProfile()` — from `/api/account/profile`, adds `organization`
  and the caller's `role`; used wherever the UI needs to gate on role
  (e.g. hiding the invite button from plain members).
- `useSchemas()`, `useEndpoints()`, `useTokens()`
- `useOrganization()`, `useMembers()`, `useInvites()`
- `useInviteDetails(token)` — public, used by the invite-accept page.

Mutation hooks:

- auth: `useSignIn()`, `useSignUp()`, `useSignOut()`
- schemas: `useCreateSchema()`, `useUpdateSchema()`, `useDeleteSchema()`
- endpoints: `useCreateEndpoint()`, `useUpdateEndpoint()`, `useDeleteEndpoint()`
- tokens: `useCreateToken()`, `useUpdateToken()`, `useDeleteToken()`
- account: `useUpdateProfile()`, `useChangePassword()`, `useUpgradePlan()`
- team: `useUpdateMemberRole()`, `useRemoveMember()`, `useCreateInvite()`,
  `useRevokeInvite()`, `useResendInvite()`, `useAcceptInvite(token)`

When adding a new dashboard API, add the hook here so pages stay thin.

## Page Pattern

Most dashboard pages follow this structure:

1. Load data with query hooks.
2. Keep modal state in local `useState`.
3. Render loading, empty, or list state.
4. Open modal for create/edit.
5. Submit through mutation hooks.
6. Display `ApiError` messages and field errors.

Example state:

```ts
type ModalState = { schema?: DataSchema } | null;
const [modal, setModal] = useState<ModalState>(null);
```

Meaning:

- `null`: closed,
- `{}`: create mode,
- `{ schema }`: edit mode.

The endpoint and token pages use the same idea.

## Shared UI Components

File: `components/ui.tsx`

Small reusable primitives:

- `Button`
- `Input`
- `Select`
- `Label`
- `Card`
- `Badge`
- `Spinner`
- `Checkbox`
- `ErrorText`
- `EmptyState`

These components are deliberately simple wrappers around Tailwind classes. They
do not own app state or data fetching.

File: `components/Modal.tsx`

The modal:

- renders only when `open` is true,
- closes on Escape,
- uses `role="dialog"` and `aria-modal="true"`,
- accepts `widthClass` for wider forms.

File: `components/CopyButton.tsx`

The copy button:

- writes to `navigator.clipboard`,
- briefly changes label to `Copied`,
- silently ignores clipboard failures.

## Schema Page Details

The schema page manages dynamic fields.

Local draft fields include:

```ts
{
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  enumValues: string[] | null;
}
```

The UI does not currently expose enum editing, but it preserves `enumValues`
when editing an existing schema so API-created enum constraints are not silently
wiped.

On submit, the page strips empty enum values because the Zod schema expects
`enumValues` to be optional, not `null`.

## Endpoint Page Details

The endpoint page needs schema data and endpoint data.

It builds a map for display:

```ts
const schemaById = new Map<string, DataSchema>();
```

When editing an endpoint, stored `[]` field lists are expanded to all schema
fields so checkboxes show the real effective behavior.

On submit, if all fields are selected, the page sends `[]` so the backend uses
the "all fields" sentinel.

The page also prevents ambiguous empty selections:

- if `GET` is enabled, at least one readable field must be selected,
- if write methods are enabled, at least one writable field must be selected.

## Token Page Details

The token page needs endpoint data to render grant labels.

Token creation has a special two-step modal:

1. User chooses name and grants.
2. API returns plaintext token once.
3. Modal switches to a reveal screen with copy action.

Once the modal closes, the plaintext token is gone. The list only shows
`tokenPrefix`.

## Account Section Details

The account section follows a different top-level shape than schemas/
endpoints/tokens: instead of one page per resource list, it's four sub-pages
under a shared `AccountNav` (`components/sections/dashboard/account/account-nav.tsx`,
same active-state pattern as the top-level `DashboardTabs`).

Profile and security are **full-page forms**, not modals — the existing
modal pattern in this codebase is for CRUD over a list (schemas/endpoints/
tokens); editing your own singular profile record doesn't fit that shape, so
it follows the sign-in/sign-up page pattern instead (`Label`/`Input`/
`ErrorText`/`Button`, `ApiError` handling).

The profile form only shows the "current password" field once the email
input differs from the loaded value, and only sends `currentPassword` in that
case — matching the API's conditional requirement.

Team page reuses the established sub-components:

- `MemberRow` — role `Select` (if the viewer can manage members) or a role
  `Badge` (if not), plus a `ConfirmModal`-gated remove button.
- `InviteRow` — pending invite with resend/revoke actions.
- `InviteModal` — two-step like `TokenFormModal`: the form, then (if the
  invite was created in dev mode or the email failed to send) a reveal
  screen with the copyable accept URL.

Billing page renders `PlanCard` (`components/sections/dashboard/account/plan-card.tsx`)
for each tier, sourcing copy from `landing.pricing.tiers.*` — the same i18n
keys the landing page's `PricingCard` uses — so the two never show different
numbers for the same plan. `PlanCard` is a deliberately separate component
from `PricingCard`, not a shared one with a mode flag: it needs a "current
plan" state and a disabled/active button that the marketing card doesn't.

## Sign-in and Sign-up Details

Both auth forms:

- submit through mutation hooks,
- set the `keys.me` query cache on success,
- redirect with `router.replace()`,
- display `ApiError.fields` beside inputs.

Sign-in also reads a `next` query param. It only honors it if it starts with
`/dashboard`, which avoids redirecting to arbitrary external URLs.

## Adding a New Dashboard Screen

Use this checklist:

1. Add or confirm the API route exists under `app/api`.
2. Add browser DTO types in `lib/client/types.ts` if needed.
3. Add query and mutation hooks in `lib/client/hooks.ts`.
4. Use shared UI primitives from `components/ui.tsx`.
5. Handle loading, empty, success, and error states.
6. Use `ApiError` to show server validation errors.
7. Invalidate all cache keys affected by a mutation.
8. Keep server-only imports out of client components.

