import * as React from "react";
import { cn } from "@/lib/client/util";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200", className)}
      {...props}
    />
  );
}
