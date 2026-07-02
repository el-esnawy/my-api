import { getSession } from "@/lib/auth/session";
import { LandingHeader } from "@/components/sections/landing/landing-header";
import { LandingFooter } from "@/components/sections/landing/landing-footer";

const quickstart = `docker compose up -d
npm install
npm run dev`;

const createRecord = `TOKEN="paste-your-token"

curl -X POST http://localhost:3000/api/v1/notes \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"First note","body":"hello","done":false}'`;

const listRecords = `curl "http://localhost:3000/api/v1/notes?done=false&limit=25" \\
  -H "Authorization: Bearer $TOKEN"`;

const envRows = [
  ["MONGODB_URI", "mongodb://localhost:27017/my-api", "MongoDB connection string."],
  ["REDIS_URL", "redis://localhost:6379", "Redis for rate limits and quota counters."],
  ["SESSION_SECRET", "development fallback", "Signs dashboard session cookies."],
  ["TOKEN_ENCRYPTION_SECRET", "development fallback", "Encrypts revealable request tokens."],
  ["NEXT_PUBLIC_APP_URL", "http://localhost:3000", "Builds endpoint and invite URLs."],
  ["RESEND_API_KEY", "empty", "Optional invite email delivery via Resend."],
];

const setupSteps = [
  {
    title: "1. Start local services",
    body: "MongoDB stores users, schemas, endpoints, tokens, and records. Redis tracks rate limits and monthly quotas.",
  },
  {
    title: "2. Create your account",
    body: "Sign up from the landing page. The app creates a personal organization and sends you to the dashboard.",
  },
  {
    title: "3. Define a schema",
    body: "Add fields, choose types, and mark required or unique constraints. A Note schema might include title, body, done, and dueAt.",
  },
  {
    title: "4. Expose an endpoint",
    body: "Choose the schema, set a slug such as notes, enable HTTP methods, and choose readable and writable fields.",
  },
  {
    title: "5. Mint a request token",
    body: "Create a token scoped to selected endpoints with read and write grants. You can reveal or revoke it later.",
  },
  {
    title: "6. Call the public API",
    body: "Send Authorization: Bearer <token> to /api/v1/:endpoint or /api/v1/:endpoint/:id.",
  },
];

export default async function DocsPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <LandingHeader signedIn={!!session} />
      <main>
        <section className="border-b border-slate-200/70 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-3xl animate-fade-up">
              <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200">
                Docs
              </span>
              <h1 className="mt-5 text-4xl font-bold text-slate-950 sm:text-5xl">
                Set up my-api and ship your first custom endpoint.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                This guide walks through local setup, dashboard workflow, request tokens,
                public API calls, and the environment settings that matter most.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
          <aside className="min-w-0 h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="font-semibold text-slate-900">Quickstart</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Requirements: Node.js 20 or newer, npm, and Docker for local MongoDB
              and Redis.
            </p>
            <CodeBlock code={quickstart} />
            <p className="mt-4 text-sm text-slate-500">
              Open <span className="break-all font-mono text-slate-700">http://localhost:3000</span>,
              sign up, then start in the Schemas tab.
            </p>
          </aside>

          <div className="min-w-0 space-y-6">
            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <h2 className="text-xl font-semibold text-slate-900">How the platform works</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {setupSteps.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <h2 className="text-xl font-semibold text-slate-900">Try the API</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                After creating a Note schema, exposing a notes endpoint, and minting a token,
                use these calls from your terminal.
              </p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">Create a record</h3>
                  <CodeBlock code={createRecord} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">List records</h3>
                  <CodeBlock code={listRecords} />
                </div>
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <h2 className="text-xl font-semibold text-slate-900">Environment checklist</h2>
              <div className="scroll-thin mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="py-3 pr-4 font-medium">Variable</th>
                      <th className="py-3 pr-4 font-medium">Local default</th>
                      <th className="py-3 font-medium">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envRows.map(([name, fallback, purpose]) => (
                      <tr key={name} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="py-3 pr-4 font-mono text-slate-800">{name}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-500">{fallback}</td>
                        <td className="py-3 text-slate-500">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <h2 className="text-xl font-semibold text-slate-900">Troubleshooting</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Trouble title="401 from public API" body="Check the Authorization header, token value, revoked status, and that the token belongs to this database." />
                <Trouble title="403 from public API" body="The token is valid, but it does not have the read or write grant required for that endpoint." />
                <Trouble title="405 from public API" body="The endpoint exists, but that HTTP method is not enabled on the endpoint definition." />
                <Trouble title="Invite email not sent" body="Set RESEND_API_KEY and EMAIL_FROM for real email delivery. Local invite creation still returns a shareable accept URL." />
              </div>
            </section>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="scroll-thin mt-3 max-w-full overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
      <code>{code}</code>
    </pre>
  );
}

function Trouble({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}
