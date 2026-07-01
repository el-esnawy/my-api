const steps = [
  { n: "1", t: "Create a schema", d: "e.g. a Note with title, body, done." },
  { n: "2", t: "Expose an endpoint", d: "/api/v1/notes with GET, POST, PUT, DELETE." },
  { n: "3", t: "Issue a token", d: "Scoped to that endpoint, read + write." },
  { n: "4", t: "Call it anywhere", d: "Authorization: Bearer <token>." },
];

export function LandingHowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {s.n}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{s.t}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
