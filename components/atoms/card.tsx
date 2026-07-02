import * as React from "react";
import { cn } from "@/lib/client/util";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 dark:border-slate-800 dark:bg-slate-900/80",
        className
      )}
      {...props}
    />
  );
}
