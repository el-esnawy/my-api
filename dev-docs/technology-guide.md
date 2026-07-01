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
- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- interactive components like `Modal` and `CopyButton`

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

- `User`
- `DataSchema`
- `Endpoint`
- `AccessToken`
- `RecordModel`

Indexes worth knowing:

- Users have unique emails.
- Schemas have unique `{ userId, slug }`.
- Endpoints have unique `{ userId, slug }`.
- Access tokens have unique `tokenHash`.
- Records are indexed by `{ endpointId, userId, createdAt: -1 }`.

## Redis and ioredis

Redis is used for public API rate limiting. It is not the source of truth for
tokens or records.

Connection management is in `lib/db/redis.ts`.

The Redis client is cached on `global._redisClient` in development. The client
logs connection errors but does not crash the app. Rate limiting fails open, so
if Redis is unavailable, legitimate API calls are allowed instead of blocked.

Rate limiting logic lives in `lib/api/rateLimit.ts`.

The public API passes the token id to:

```ts
rateLimit(String(auth.token._id))
```

This means the fixed window is per access token, not per IP address.

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
}
```

The signed JWT is stored in the `my_api_session` cookie.

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

