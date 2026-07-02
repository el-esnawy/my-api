# Local Development and Operations

This guide explains how to run the project locally and how the supporting
services fit together.

## Requirements

The project expects:

- Node.js 20 or newer, based on `package.json`.
- Docker, for local MongoDB and Redis.
- npm, because the repo includes `package-lock.json`.

## Install and Run

From the repository root:

```bash
docker compose up -d
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Local Services

`docker-compose.yml` starts two services.

### MongoDB

```yaml
image: mongo:7
ports:
  - "27017:27017"
volumes:
  - ./docker-data/mongo:/data/db
```

MongoDB stores the application source of truth:

- users,
- organizations, memberships, invites,
- schemas,
- endpoints,
- access-token metadata,
- records.

Default app connection string:

```text
mongodb://localhost:27017/my-api
```

### Redis

```yaml
image: redis:7-alpine
ports:
  - "6379:6379"
command: ["redis-server", "--appendonly", "yes"]
volumes:
  - ./docker-data/redis:/data
```

Redis stores rate-limit counters and monthly-quota counters for the public
API, keyed per organization.

Default app connection string:

```text
redis://localhost:6379
```

If Redis is down, public API rate limiting fails open. The app logs a warning
but allows requests.

## Environment Variables

File: `lib/env.ts`

The app has local defaults so it can boot without a `.env.local`, but production
must set real values.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017/my-api` | MongoDB connection. |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection. |
| `SESSION_SECRET` | development-only string | HMAC secret for dashboard session JWTs. |
| `SESSION_TTL` | `7d` | JWT expiration passed to `jose`. |
| `TOKEN_ENCRYPTION_SECRET` | development-only string | AES-256-GCM key for at-rest access-token encryption (reveal feature). |
| `RATE_LIMIT_WINDOW` | `60` | Shared window length (seconds) for the per-minute rate limit. The *count* allowed per window is plan-derived (`lib/billing/plans.ts`), not env-configured. |
| `RATE_LIMIT_MAX` | — | Deprecated — no longer read on the request path. Safe to delete from `.env`; kept as a documented no-op so old files don't need to change. |
| `RESEND_API_KEY` | `""` (no safe fallback) | Sends team-invite emails. Without a real key, invite creation still succeeds — the email just doesn't send (logged as a warning), and the accept URL is echoed back in the API response outside of production so the flow is still testable. |
| `EMAIL_FROM` | `"My API <onboarding@resend.dev>"` | Must be a verified sender in your Resend account, or use Resend's shared onboarding domain for local dev. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public app base URL used by UI helpers and to build invite accept links. |

Important: replace `SESSION_SECRET` outside local development. If the secret is
weak or shared, dashboard session cookies are not trustworthy.

To exercise invites locally without a Resend account: leave `RESEND_API_KEY`
unset, create an invite from the Team page, and copy the accept URL shown
directly in the "invite created" screen (only shown outside production).

## npm Scripts

From `package.json`:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

Use:

- `npm run dev` for local development.
- `npm run build` to type-check and build the Next.js app.
- `npm run start` after a production build.

The lint script may need maintenance with current Next.js versions because
`next lint` behavior has changed over time.

## Common Local Debugging

### Cannot connect to MongoDB

Check:

```bash
docker compose ps
```

MongoDB should expose port `27017`.

If the app starts before MongoDB is ready, retry the request after a few seconds.

### Cannot connect to Redis

The app should continue serving public API traffic because rate limiting fails
open. You may see a warning like:

```text
[redis] connection error (degrading gracefully)
```

Check that Redis is running and port `6379` is available.

### Dashboard redirects to sign-in

This means middleware did not find a valid `my_api_session` cookie.

Try:

1. Sign in again.
2. Confirm `SESSION_SECRET` did not change between issuing and verifying the
   cookie.
3. Confirm the request path is under `/dashboard`.

### Public API returns 401

Common causes:

- missing `Authorization` header,
- token was copied incorrectly,
- token was deleted,
- token is revoked,
- token belongs to a different environment or database.

### Public API returns 403

Common causes:

- token does not have a grant for that endpoint,
- token has read but not write permission,
- token has write but not read permission.

### Public API returns 405

The endpoint exists, and the token is valid, but that HTTP method is not enabled
on the endpoint.

### Public API returns 404 for an endpoint

Endpoint lookup is scoped by the token's organization:

```ts
Endpoint.findOne({ organizationId: token.organizationId, slug })
```

So this can mean either:

- no endpoint with that slug exists in the token's organization,
- the token belongs to a different organization than expected.

## Organization Backfill Migration

`scripts/backfill-organizations.mjs` is a one-off migration for local data
that predates the Organization/Membership model (every `User` used to
directly own their schemas/endpoints/tokens/records via `userId`; those
fields are now `organizationId` + `createdBy`).

```bash
node scripts/backfill-organizations.mjs
```

For every `User` without a `Membership`, it creates a personal `Organization`
(`plan: "hobby"`) and an `owner` `Membership`, then re-points that user's
existing schemas/endpoints/tokens/records at the new `organizationId`
(renaming their `userId` field to `createdBy`). It's idempotent — safe to
re-run; already-migrated users and documents are skipped. Modeled on
`scripts/backfill-entries.mjs` (raw `mongoose.connect` + `db.collection(...)`,
not the Mongoose models, so it doesn't break if the models change shape
later).

This is local Docker Mongo data only — run it once after pulling model
changes, before starting the app.

## Data Persistence

Local Docker data is stored in `docker-data`.

Deleting that folder removes local MongoDB and Redis data. Be careful: it will
wipe local users, organizations, memberships, invites, schemas, endpoints,
tokens, records, and rate-limit/quota counters.

## Build-Time Notes

`next.config.ts` contains:

```ts
serverExternalPackages: ["mongoose", "ioredis"]
```

Keep this in mind when changing database packages. Some Node-oriented packages
do not bundle cleanly into Next.js server output.

## Before Handing Work Off

For backend or shared behavior changes, run:

```bash
npm run build
```

For frontend behavior changes, also start the app and manually check:

- sign-up (creates an Organization + owner Membership),
- sign-in,
- schema creation,
- endpoint creation,
- token creation,
- at least one public API call with the created token,
- hitting a Hobby-plan resource cap (3rd schema/endpoint or 2nd token) returns
  a `403` with an upgrade message,
- switching plans on the Billing page and confirming caps lift,
- inviting a teammate on the Team page and accepting as both a brand-new user
  and (separately) a user who already has their own account (should be
  rejected — see the "Known v1 Limitations" note in dashboard-management-flows.md),
- changing name, email (with current password), and password from the
  Account pages.

