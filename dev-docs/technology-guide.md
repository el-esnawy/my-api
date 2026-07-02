# Technology Guide

This file explains how each major technology is used in `my-api` and where to
look when changing it.

## Next.js App Router

Next.js is the application framework. It serves:

- React pages under `app/**/page.tsx`.
- Nested layouts under `app/**/layout.tsx`.
- API route handlers under `app/api/**/route.ts`.
- Edge middleware from `middleware.ts`.

Important patterns:

- The app uses route groups like `app/(auth)` and `app/(dashboard)` to organize
  routes without adding those group names to the URL.
- API routes export HTTP methods such as `GET`, `POST`, `PUT`, `PATCH`, and
  `DELETE`.
- Most API routes set `export const runtime = "nodejs";` because they use
  MongoDB, Redis, cookies, password hashing, or Node crypto.
- `next.config.ts` lists `mongoose` and `ioredis` in `serverExternalPackages`.
  Those packages use Node internals and should stay external to the server
  compiler.

Where to look:

- `app/layout.tsx` for the root layout and global providers.
- `app/page.tsx` for the landing page.
- `app/api/**/route.ts` for HTTP behavior.
- `middleware.ts` for dashboard route protection.

## React

React powers the browser dashboard. Dashboard pages are client components because
they use hooks, local form state, modals, and browser navigation.

You will see `"use client";` at the top of:

- `app/(dashboard)/dashboard/layout.tsx`
- `app/(dashboard)/dashboard/schemas/page.tsx`
- `app/(dashboard)/dashboard/endpoints/page.tsx`
- `app/(dashboard)/dashboard/tokens/page.tsx`
- `app/(dashboard)/dashboard/account/layout.tsx` and its four sub-pages
- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- interactive components like `Modal` and `CopyButton`

`app/invite/[token]/page.tsx` (via `components/pages/invite-accept.tsx`) is
the one auth-adjacent page that's a **server** component — it awaits the
route's `params` and renders a client child (`InviteAcceptForm`) for the
actual interactivity, the same split used by dynamic API route handlers.

Common frontend pattern:

1. Page reads data with a query hook, such as `useSchemas()`.
2. Page opens a modal with local `useState`.
3. Modal submits through a mutation hook, such as `useCreateSchema()`.
4. Hook invalidates the relevant cache key.
5. Page re-renders with fresh data.

## TypeScript

TypeScript is used throughout the project. `tsconfig.json` enables `strict` mode
and defines the `@/*` path alias.

Examples:

- Server model types use Mongoose `InferSchemaType`.
- Browser DTO types live in `lib/client/types.ts`.
- Route handlers type dynamic params as promises because of the current Next.js
  App Router route-handler shape used in this codebase.

When adding shared types, choose the layer carefully:

- Browser-safe types belong in `lib/client/types.ts`.
- Mongoose document types belong beside the model in `lib/models`.
- Input schema inferred types belong in `lib/validation/schemas.ts`.

## MongoDB and Mongoose

MongoDB stores users, schemas, endpoints, access-token metadata, and records.
Mongoose defines models and indexes.

Connection management is in `lib/db/mongoose.ts`.

The connection is cached on `global._mongooseCache` so development hot reloads
and serverless-style module re-evaluation do not open a new connection pool for
every request.

Models:

- `User` — identity only (email/password/name); no plan or org fields.
- `Organization` — the tenant boundary; has `plan`.
- `Membership` — joins `User` to `Organization` with a `role`.
- `Invite` — pending email invitation to an `Organization`.
- `DataSchema`, `Endpoint`, `AccessToken` — all `organizationId`-owned, with
  a `createdBy` audit field.
- `RecordModel` — `organizationId`-owned, `createdBy` audit field, `schemaId`
  owner + `endpointId` provenance.

Indexes worth knowing:

- Users have unique emails.
- Memberships have unique `{ organizationId, userId }` (not unique on
  `userId` alone — v1's "one org per user" rule is enforced in application
  code, not the schema, so it doesn't block adding multi-org later).
- Schemas have unique `{ organizationId, slug }`.
- Endpoints have unique `{ organizationId, slug }`.
- Access tokens have unique `tokenHash`; invites have unique `tokenHash` too
  (separate collection, same hash-only-storage approach).
- Records are indexed by `{ schemaId, organizationId, createdAt: -1 }`.

## Redis and ioredis

Redis is used for public API rate limiting and monthly quota tracking. It is
not the source of truth for tokens or records.

Connection management is in `lib/db/redis.ts`.

The Redis client is cached on `global._redisClient` in development. The client
logs connection errors but does not crash the app. Both the rate limiter and
the quota counter fail open, so if Redis is unavailable, legitimate API calls
are allowed instead of blocked.

Rate limiting and quota logic live in `lib/api/rateLimit.ts`. The public
engine passes the calling organization's plan-derived limits:

```ts
rateLimit(`org:${auth.organizationId}`, limits.requestsPerMinute, env.RATE_LIMIT_WINDOW)
checkMonthlyQuota(auth.organizationId, limits.requestsPerMonth)
```

This means the fixed window (and the monthly quota) is per organization, not
per token or per IP address — every token an organization mints shares one
throughput budget. `limits` comes from `lib/billing/plans.ts`, keyed by
`Organization.plan`.

## TanStack Query

TanStack Query manages browser-side server state for the dashboard.

The provider is installed in `app/layout.tsx` through
`providers/QueryProvider.tsx`.

`QueryProvider` configures:

- `staleTime: 30_000`
- `retry: 1`
- `refetchOnWindowFocus: false`

All dashboard hooks are in `lib/client/hooks.ts`.

Cache keys:

```ts
keys.me
keys.schemas
keys.endpoints
keys.tokens
keys.entryCounts
keys.entries(schemaId)
keys.account.organization
keys.account.members
keys.account.invites
```

After mutations, hooks invalidate affected queries. For example, updating a
schema invalidates both schemas and endpoints because endpoints display schema
field information.

## Zod

Zod validates structured dashboard inputs before they reach MongoDB.

Definitions live in `lib/validation/schemas.ts`.

Examples:

- `signUpInput`
- `signInInput`
- `createSchemaInput`
- `updateSchemaInput`
- `createEndpointInput`
- `updateEndpointInput`
- `createTokenInput`
- `updateTokenInput`
- `updateProfileInput` — `superRefine`s `currentPassword` in when `email` is present
- `changePasswordInput`
- `updateOrganizationInput`, `updatePlanInput`
- `updateMemberInput`, `createInviteInput`, `acceptInviteInput`

Route handlers call `safeParse()` and return:

```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email"
  }
}
```

The `zodErrors()` helper in `lib/api/respond.ts` flattens Zod issues into that
field map.

## jose

`jose` signs and verifies dashboard session JWTs.

The important file is `lib/auth/jwt.ts`.

This file is intentionally Edge-safe. It can be imported by `middleware.ts`,
which runs before dashboard pages load.

Session payload:

```ts
{
  userId: string;
  email: string;
  orgId: string;
  role: "owner" | "admin" | "member";
}
```

The signed JWT is stored in the `my_api_session` cookie. `orgId`/`role` are
resolved once at sign-up/sign-in/invite-accept time and trusted for the life
of the session — see auth-and-security.md's "Session Cookie" section for the
staleness trade-off this implies.

## bcryptjs

`bcryptjs` hashes and verifies dashboard passwords.

The wrapper is `lib/auth/password.ts`.

The app uses `SALT_ROUNDS = 10`.

Route usage:

- Sign-up hashes `parsed.data.password` before storing a user.
- Sign-in compares the submitted password with the stored `passwordHash`.

## Node crypto

Node `crypto` is used for public access tokens in `lib/auth/token.ts`.

It provides:

- `randomBytes(32)` to generate a strong secret.
- SHA-256 hashing for stored token lookup.
- `timingSafeEqual()` for constant-time hash comparison if needed.

Access token format:

```text
mapi_<base64url-random-secret>
```

Only the hash is stored. The plaintext is returned once from
`POST /api/tokens`.

The same module's `generateInviteToken()` produces invite tokens the same
way (random bytes + sha256 hash), but skips the AES-256-GCM
encrypted-for-reveal copy that access tokens have — an invite link is only
ever shown once, in the email, and never needs to be redisplayed later.

## Resend

`resend` sends team-invite emails. The client and template live in
`lib/email/`.

- `lib/email/client.ts` — `getResendClient()` lazily constructs the SDK
  client, returning `null` if `RESEND_API_KEY` isn't set (the SDK throws at
  construction time if given no key, so it's never constructed without one).
- `lib/email/sendInviteEmail.ts` — builds a plain HTML template literal
  (no `@react-email` dependency for one template) and sends it. Never
  throws — a failed or skipped send returns `false` rather than failing the
  invite-creation request; the `Invite` row is still created either way.

Unlike every other env var in `lib/env.ts`, `RESEND_API_KEY` has no safe
local-dev fallback. Without a real key, invites still work end-to-end in
local development because the invite-create/resend API responses echo the
plaintext accept URL directly when `!env.isProd`.

## Tailwind CSS

Tailwind CSS is used directly through class names in components.

Global CSS lives in `app/globals.css` and imports Tailwind with:

```css
@import "tailwindcss";
```

Reusable UI primitives are in `components/ui.tsx`:

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

The app does not have a large design-system package. Prefer extending these
small primitives before scattering new one-off styles everywhere.

## Docker Compose

`docker-compose.yml` runs local MongoDB and Redis.

Services:

- `mongo:7` exposed on `27017`.
- `redis:7-alpine` exposed on `6379`.

Data is persisted under:

- `docker-data/mongo`
- `docker-data/redis`

Those folders are local development data, not application source.

## ESLint

The project includes ESLint 9 and `eslint-config-next`, but the current
`package.json` script is:

```json
"lint": "next lint"
```

That command may need attention with newer Next.js versions because `next lint`
has changed across releases. If linting fails because of tool-version behavior,
check the Next.js version and ESLint config before assuming application code is
broken.

