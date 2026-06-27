# my-api — Custom REST Endpoint Builder

Define your own data schemas, generate REST endpoints from them, and call those endpoints
from anywhere using per-account **access tokens**. Built with the Next.js App Router, MongoDB,
Redis, and TanStack Query.

## What you can do

- **Schemas tab** — define a "data type" (fields + types + required/unique rules).
- **Endpoints tab** — turn a schema into a REST endpoint, choose which HTTP verbs are allowed,
  and choose which fields are *readable* (returned by GET) and *writable* (accepted by POST/PUT/PATCH).
- **Tokens tab** — mint access tokens scoped to specific endpoints with read/write permissions.
  Each token belongs to exactly one account and can only reach that account's endpoints.

Your data lives in MongoDB; Redis handles token-lookup caching and per-token rate limiting.

## Architecture

- **One Next.js app** (App Router). REST lives in `app/api/.../route.ts` — no separate server.
- **Dashboard auth:** email/password → bcrypt → JWT in an httpOnly cookie (signed with `jose`).
- **Public API auth:** `Authorization: Bearer <access-token>`. The token identifies the tenant,
  so every query is scoped by `userId` + `endpointId` — one user can never touch another's data.
- **Edge middleware** gates `/dashboard/*` with a signature-only JWT check (no DB on the edge).

```
app/
  page.tsx                              landing
  (auth)/sign-in · (auth)/sign-up
  (dashboard)/dashboard/{schemas,endpoints,tokens}
  api/auth/{sign-up,sign-in,sign-out,me}
  api/{schemas,endpoints,tokens}        dashboard CRUD (cookie auth)
  api/v1/[endpoint]/[[...recordId]]     PUBLIC dynamic REST engine (token auth)
lib/
  db/{mongoose,redis} · models/* · auth/* · validation/* · records/* · api/*
```

## Getting started

Requirements: Node 18.18+ and Docker (for local Mongo + Redis).

```bash
# 1. Start MongoDB + Redis
docker compose up -d

# 2. Install dependencies
npm install

# 3. Environment — .env.local is already provided for local dev.
#    (Copy .env.example if you need to recreate it; change SESSION_SECRET for anything real.)

# 4. Run
npm run dev
```

Open http://localhost:3000, sign up, and you'll land on the dashboard.

## Try a custom endpoint

1. **Schemas** → create `Note` with fields `title` (string, required), `body` (string), `done` (boolean).
2. **Endpoints** → create endpoint slug `notes` from the `Note` schema; enable `GET/POST/PUT/DELETE`;
   mark fields readable/writable. The page shows your base URL: `http://localhost:3000/api/v1/notes`.
3. **Tokens** → create a token scoped to `notes` with read + write. Copy it (shown once).

```bash
TOKEN="paste-your-token"

# Create a record
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"First note","body":"hello","done":false}'

# List records
curl http://localhost:3000/api/v1/notes -H "Authorization: Bearer $TOKEN"

# Update / delete by id
curl -X PUT http://localhost:3000/api/v1/notes/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"done":true}'
curl -X DELETE http://localhost:3000/api/v1/notes/<id> -H "Authorization: Bearer $TOKEN"
```

## Security model

- Passwords hashed with bcrypt; sessions are signed JWTs in httpOnly, SameSite=Lax cookies.
- Access tokens are random 32-byte secrets; only their SHA-256 hash is stored. The plaintext is
  shown exactly once at creation.
- Every public request resolves the tenant from the token, then checks: token not revoked →
  endpoint owned by that tenant → endpoint id in the token's allow-list → verb permitted by both the
  endpoint and the token scope. All record I/O is scoped by `{ userId, endpointId }`.
- Per-token fixed-window rate limiting via Redis (configurable in `.env`).

## Environment variables

See [`.env.example`](.env.example) for the full list (Mongo/Redis URLs, `SESSION_SECRET`,
session TTL, rate-limit window).
