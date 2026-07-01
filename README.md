# my-api — Custom REST Endpoint Builder

Define your own data schemas, generate REST endpoints from them, and call those endpoints
from anywhere using per-account **access tokens**. Built with the Next.js App Router, MongoDB,
Redis, and TanStack Query.

## What you can do

- **Schemas tab** — define a "data type" (fields + types + required/unique rules).
- **Endpoints tab** — turn a schema into a REST endpoint, choose which HTTP verbs are allowed,
  and choose which fields are _readable_ (returned by GET) and _writable_ (accepted by POST/PUT/PATCH).
- **Request Tokens tab** — mint request tokens scoped to specific endpoints with read/write
  permissions. Each token belongs to exactly one account and can only reach that account's
  endpoints. Tokens can be viewed again anytime after creation, not just at creation time.

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
  api/v1/[endpoint] and /[id]           PUBLIC dynamic REST engine (token auth)
lib/
  db/{mongoose,redis} · models/* · auth/* · validation/* · records/* · api/*
```

## Developer docs

Detailed onboarding docs live in [`dev-docs`](dev-docs/README.md):

- [Architecture overview](dev-docs/architecture-overview.md)
- [Technology guide](dev-docs/technology-guide.md)
- [Auth and security flow](dev-docs/auth-and-security.md)
- [Data model and validation](dev-docs/data-model-and-validation.md)
- [Dashboard management flows](dev-docs/dashboard-management-flows.md)
- [Public API engine](dev-docs/public-api-engine.md)
- [Frontend dashboard](dev-docs/frontend-dashboard.md)
- [Local development and operations](dev-docs/local-development-and-operations.md)

## Getting started

Requirements: Node 20+ and Docker (for local Mongo + Redis).

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
2. **Endpoints** → create endpoint slug `notes` from the `Note` schema; enable `GET many/GET/POST/PUT/DELETE`;
   mark fields readable/writable. The page shows your base URL: `http://localhost:3000/api/v1/notes`.
3. **Request Tokens** → create a request token scoped to `notes` with read + write. Copy it now,
   or view it again anytime from the token list.

```bash
TOKEN="paste-your-token"

# Create a record
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"First note","body":"hello","done":false}'

# List records
curl http://localhost:3000/api/v1/notes -H "Authorization: Bearer $TOKEN"

# Fetch one record by id
curl http://localhost:3000/api/v1/notes/<id> -H "Authorization: Bearer $TOKEN"

# Update / delete by id
curl -X PUT http://localhost:3000/api/v1/notes/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"done":true}'
curl -X DELETE http://localhost:3000/api/v1/notes/<id> -H "Authorization: Bearer $TOKEN"
```

## Security model

- Passwords hashed with bcrypt; sessions are signed JWTs in httpOnly, SameSite=Lax cookies.
- Request tokens are random 32-byte secrets. A SHA-256 hash authenticates every public API call;
  an AES-256-GCM encrypted copy (`TOKEN_ENCRYPTION_SECRET`) lets the owner view the plaintext
  again later from the dashboard, decrypted on demand and never included in list responses.
- Every public request resolves the tenant from the token, then checks: token not revoked →
  endpoint owned by that tenant → endpoint id in the token's allow-list → verb permitted by both the
  endpoint and the token scope. All record I/O is scoped by `{ userId, endpointId }`.
- Per-token fixed-window rate limiting via Redis (configurable in `.env`).

## Environment variables

See [`.env.example`](.env.example) for the full list (Mongo/Redis URLs, `SESSION_SECRET`,
session TTL, rate-limit window).

## Future Works Needed

- Payment gateway and subscription tiers
- My Account section, which has the pricing and will actually enforce the limits
- Add proper account sign-up, Email Verification, more Info, forgot/reset password flow
- Add Translation to the entire app
- Add Documentation page as a guide to users
- Add more data types
- Use a unified dropdown instead of the default per os
- Add dark mode
- Revamp landing page UI
- Think about templates and real-world usage
- Add Analytics
