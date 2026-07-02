import type { DataSchema } from "@/lib/client/types";
import { Badge } from "@/components/atoms/badge";
import { useTranslation } from "react-i18next";

export function EndpointFieldList({
  label,
  fields,
  schema,
}: {
  label: string;
  fields: string[];
  schema?: DataSchema;
}) {
  const { t } = useTranslation();
  const all = schema ? schema.fields.map((f) => f.name) : [];
  const effective = fields.length === 0 ? all : fields;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {effective.length === 0 ? (
          <span className="text-sm text-slate-400">{t("common.none")}</span>
        ) : (
          effective.map((f) => (
            <Badge key={f} className="font-mono">
              {f}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
