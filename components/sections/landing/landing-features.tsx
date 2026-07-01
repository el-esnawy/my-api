import type { IconType } from "react-icons";
import { SchemaIcon } from "@/components/atoms/icons/schema-icon";
import { EndpointIcon } from "@/components/atoms/icons/endpoint-icon";
import { TokenIcon } from "@/components/atoms/icons/token-icon";

const features: Array<{ title: string; body: string; Icon: IconType }> = [
  {
    title: "Define schemas",
    body: "Describe your data once — fields, types, required rules. No migrations, no boilerplate.",
    Icon: SchemaIcon,
  },
  {
    title: "Generate REST endpoints",
    body: "Turn any schema into a real REST resource. Pick the verbs, choose what's readable and writable.",
    Icon: EndpointIcon,
  },
  {
    title: "Query with access tokens",
    body: "Mint per-account tokens scoped to specific endpoints. Revoke any time. Strictly isolated per user.",
    Icon: TokenIcon,
  },
];

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <f.Icon size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
