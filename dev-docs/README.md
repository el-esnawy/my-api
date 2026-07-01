# Developer Documentation

This folder is the engineering handbook for `my-api`. It is written for a new
developer who understands web basics but has not worked in this codebase yet.

Start here, then follow the links in the order that matches the work you are
doing.

## Recommended Reading Order

1. [Architecture overview](./architecture-overview.md) - the core product model,
   important directories, and the two major request families.
2. [Technology guide](./technology-guide.md) - how Next.js, React, MongoDB,
   Redis, TanStack Query, Zod, `jose`, `bcryptjs`, Tailwind CSS, and Docker are
   used in this app.
3. [Auth and security flow](./auth-and-security.md) - dashboard sessions, public
   API access tokens, tenant isolation, rate limiting, and security invariants.
4. [Data model and validation](./data-model-and-validation.md) - Mongoose
   models, relationships, field validation, serialization, and important edge
   cases.
5. [Dashboard management flows](./dashboard-management-flows.md) - how schemas,
   endpoints, and access tokens are created, updated, listed, and deleted.
6. [Public API engine](./public-api-engine.md) - how `/api/v1/:endpoint` turns
   user-defined schemas into real REST endpoints.
7. [Frontend dashboard](./frontend-dashboard.md) - React component structure,
   hooks, cache invalidation, forms, modals, and error handling.
8. [Local development and operations](./local-development-and-operations.md) -
   how to run the app locally, understand environment variables, and debug the
   common supporting services.

## The Short Version

`my-api` lets signed-in users define data schemas, expose those schemas as REST
endpoints, and create bearer tokens that external callers use to read and write
records.

The most important invariant is:

> Every dashboard and public API data operation must be scoped by the owning
> `userId`.

That rule is what prevents one account from seeing or changing another account's
schemas, endpoints, tokens, or records. When you add features, look for that
scope first.

## Main Code Areas

| Area | Purpose |
| --- | --- |
| `app/(auth)` | Sign-in and sign-up pages. |
| `app/(dashboard)` | Authenticated dashboard UI for schemas, endpoints, and tokens. |
| `app/api/auth` | Cookie-session auth endpoints. |
| `app/api/schemas`, `app/api/endpoints`, `app/api/tokens` | Dashboard management APIs. |
| `app/api/v1` | Public REST engine called by external clients with bearer tokens. |
| `lib/models` | Mongoose models for users, schemas, endpoints, tokens, and records. |
| `lib/api` | Shared API helpers for auth gates, responses, rate limiting, and public engine plumbing. |
| `lib/auth` | Password hashing, session JWTs, and access-token helpers. |
| `lib/records` | Runtime validation and projection for stored record data. |
| `lib/client` | Browser-side API wrapper, React Query hooks, types, and small utilities. |

## Vocabulary

| Term | Meaning |
| --- | --- |
| User | A dashboard account. Owns schemas, endpoints, tokens, and records. |
| DataSchema | A user-defined data type, such as `Note` or `Customer`. |
| Field | One property inside a schema, with a type like `string`, `number`, `boolean`, or `date`. |
| Endpoint | A REST resource generated from a `DataSchema`, exposed at `/api/v1/:slug`. |
| AccessToken | A bearer token created in the dashboard and scoped to specific endpoints. |
| Grant | One token's read/write permission for one endpoint. |
| Record | One stored item for an endpoint. Its shape is validated against the endpoint's schema. |

