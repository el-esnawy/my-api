# Public API Engine

The public API engine turns user-created endpoint definitions into real REST
routes.

External clients call:

```text
/api/v1/:endpoint
/api/v1/:endpoint/:id
```

with:

```http
Authorization: Bearer mapi_<secret>
```

## Key Files

| File | Purpose |
| --- | --- |
| `app/api/v1/[endpoint]/route.ts` | List records and create records. |
| `app/api/v1/[endpoint]/[id]/route.ts` | Fetch, update, patch, and delete one record. |
| `lib/api/publicEngine.ts` | Shared gate, rate-limit + quota handling, schema field loading, JSON-with-headers helper. |
| `lib/api/publicAuth.ts` | Bearer-token authorization and permission checks. |
| `lib/api/rateLimit.ts` | Redis fixed-window rate limiter + monthly quota counter. |
| `lib/billing/plans.ts` | Per-plan `requestsPerMinute` / `requestsPerMonth` / resource caps — the single source of truth `gate()` reads from. |
| `lib/records/validate.ts` | Dynamic record validation, filter coercion, readable-field projection. |
| `lib/models/Record.ts` | Stored record model. |

## Gate First

Every public route starts by calling `gate()`.

```ts
const g = await gate(req, slug, "GET_MANY");
if (!g.ok) return g.response;
const { auth, headers } = g;
```

`gate()` does three things:

1. Calls `authorizePublicRequest()` to verify token, endpoint, method, and grant.
2. Looks up the token's organization plan and calls `rateLimit()` — a
   per-minute budget, keyed by **organization** (`rl:org:<orgId>`), shared
   across every token that organization has minted.
3. Calls `checkMonthlyQuota()` — a UTC-calendar-month budget, also keyed by
   organization.

If any step fails, the route returns early — a 401/403/404/405 from step 1,
or a 429 from step 2 or 3.

If all succeed, the route receives:

- `auth.organizationId`
- `auth.token`
- `auth.endpoint`
- `auth.grant`
- headers to attach to the response: rate-limit headers always, quota
  headers when the plan's monthly limit isn't unmetered.

Why organization-keyed instead of token-keyed: the whole point of tying
throughput to a subscription tier is that the tier's budget belongs to the
organization, not to however many tokens it happens to have minted — minting
more tokens doesn't buy more throughput.

## Method Behavior

| Endpoint method | HTTP route | Permission needed | Behavior |
| --- | --- | --- | --- |
| `GET_MANY` | `GET /api/v1/:endpoint` | read | List records with optional filters and pagination. |
| `POST` | `POST /api/v1/:endpoint` | write | Create one record. |
| `PUT_MANY` | `PUT /api/v1/:endpoint` | write | Full update for many records. |
| `PATCH_MANY` | `PATCH /api/v1/:endpoint` | write | Partial update for many records. |
| `GET` | `GET /api/v1/:endpoint/:id` | read | Fetch one record by id. |
| `PUT` | `PUT /api/v1/:endpoint/:id` | write | Full update. Required writable fields are enforced. |
| `PATCH` | `PATCH /api/v1/:endpoint/:id` | write | Partial update. Required-field checks are skipped. |
| `DELETE` | `DELETE /api/v1/:endpoint/:id` | write | Delete one record. |

The endpoint must also have the method enabled in `endpoint.methods`.

## Listing Records

`GET /api/v1/:endpoint` supports:

- `limit`, default `50`, min `1`, max `200`.
- `skip`, default `0`, min `0`, max `1_000_000`.
- equality filters for readable schema fields.

Example:

```http
GET /api/v1/tasks?done=false&limit=25
Authorization: Bearer mapi_...
```

Flow:

1. Authorize and rate-limit with `gate(req, slug, "GET_MANY")`.
2. Load schema fields with `loadFields(auth)`.
3. Start a MongoDB filter with `organizationId` and `schemaId`.
4. For each schema field:
   - only consider it if the field is readable,
   - read the query-string value,
   - coerce it to the field type,
   - add `data.<fieldName>` to the MongoDB filter.
5. Query records sorted by `createdAt: -1`.
6. Count matching records.
7. Project each record through `projectReadable()`.
8. Return records and pagination metadata.

Response shape:

```json
{
  "records": [
    {
      "id": "record-id",
      "data": {
        "title": "Ship docs",
        "done": false
      },
      "createdAt": "2026-07-01T00:00:00.000Z",
      "updatedAt": "2026-07-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 25,
    "skip": 0
  }
}
```

## Creating Records

`POST /api/v1/:endpoint` accepts a JSON object.

Flow:

1. Authorize as `POST`.
2. Load schema fields.
3. Parse request JSON.
4. Validate with `validateRecordData(fields, body, { writableFields })`.
5. Create `RecordModel` with:
   - `organizationId`,
   - `createdBy: auth.token.createdBy` (the user who minted the token — best-effort audit trail; there's no signed-in user on a public API call),
   - `schemaId`, `endpointId`,
   - cleaned `data`.
6. Return the created record after readable-field projection.

Validation ignores unknown fields and fields that are not writable for the
endpoint.

## Fetching One Record

`GET /api/v1/:endpoint/:id`

Flow:

1. Authorize as `GET`.
2. Reject invalid MongoDB ObjectIds as `404 Record not found`.
3. Find the record with:

```ts
{
  _id: id,
  organizationId: auth.organizationId,
  schemaId: auth.endpoint.schemaId
}
```

4. Return the record with readable-field projection.

The 404 for invalid ObjectIds is intentional. Clients do not need to know
whether an id was malformed or simply absent.

## Updating Records

`PUT` and `PATCH` share `applyUpdate()`.

Differences:

- `PUT` passes `partial: false`.
- `PATCH` passes `partial: true`.

`partial: false` means required writable fields must be present in the request.
`partial: true` skips required-field checks and only validates fields that are
present.

The current update behavior merges cleaned values into existing data:

```ts
rec.data = { ...existingData, ...result.value };
rec.markModified("data");
await rec.save();
```

That means even `PUT` is not a destructive replacement of the whole `data`
object. It enforces required fields, but it does not remove stored fields that
are omitted from the request.

## Deleting Records

`DELETE /api/v1/:endpoint/:id`

Flow:

1. Authorize as `DELETE`.
2. Validate `id` shape.
3. Delete by `_id`, `organizationId`, and `schemaId`.
4. Return `{ success: true, id }`.

## Field Permissions

Endpoint field permissions are enforced in two places.

On writes:

```ts
validateRecordData(fields, body, {
  writableFields: auth.endpoint.writableFields ?? []
})
```

On reads:

```ts
projectReadable(record.data, auth.endpoint.readableFields ?? [])
```

An empty readable or writable field list means all schema fields.

## Rate-Limit and Quota Headers

Every successful public route response includes:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 60
```

Plus, for metered plans (not `enterprise`, which is unmetered):

```http
X-Quota-Limit: 10000
X-Quota-Remaining: 9998
```

The exact values depend on the calling organization's `plan` (see
`lib/billing/plans.ts`) and current usage — not environment variables; the
`RATE_LIMIT_MAX` env var is no longer read on the request path (see
local-development-and-operations.md).

When per-minute rate-limited, the engine returns `429` with:

```json
{ "error": "Rate limit exceeded" }
```

When the monthly quota is exhausted, it returns `429` with a distinct message:

```json
{ "error": "Monthly request quota exceeded for your plan. Upgrade for more, or wait for next month." }
```

## Adding a New Public API Feature

When adding public API behavior, preserve these rules:

1. Start with `gate()`.
2. Keep `organizationId` and `schemaId` (or `endpointId`, for provenance) in
   record queries.
3. Load schema fields through `loadFields(auth)` when validating or filtering
   data.
4. Apply readable-field projection before returning record data.
5. Attach rate-limit and quota headers to responses.
6. Return consistent JSON error shapes.
7. Think through how the change interacts with endpoint methods, grants,
   readable fields, and writable fields.
8. If the change creates a new plan-limited resource, add its cap to
   `lib/billing/plans.ts` and enforce it with `assertUnderLimit()`.
