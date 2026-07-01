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

Redis stores rate-limit counters for public API tokens.

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
| `RATE_LIMIT_MAX` | `120` | Max public API requests per window per token. |
| `RATE_LIMIT_WINDOW` | `60` | Rate-limit window in seconds. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public app base URL used by UI helpers. |

Important: replace `SESSION_SECRET` outside local development. If the secret is
weak or shared, dashboard session cookies are not trustworthy.

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

Endpoint lookup is scoped by token owner:

```ts
Endpoint.findOne({ userId: token.userId, slug })
```

So this can mean either:

- no endpoint with that slug exists for the token owner,
- the token belongs to a different user than expected.

## Data Persistence

Local Docker data is stored in `docker-data`.

Deleting that folder removes local MongoDB and Redis data. Be careful: it will
wipe local users, schemas, endpoints, tokens, records, and rate-limit counters.

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

- sign-up,
- sign-in,
- schema creation,
- endpoint creation,
- token creation,
- at least one public API call with the created token.

