import * as React from "react";
import { Card } from "@/components/atoms/card";

export function AuthFormCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="p-7 shadow-xl shadow-slate-200/60 dark:shadow-black/30">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {children}
      {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
    </Card>
  );
}
