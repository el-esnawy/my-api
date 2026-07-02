import * as React from "react";
import { cn } from "@/lib/client/util";

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "slate" | "indigo" | "green" | "yellow" | "blue" | "purple" | "amber" | "red";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
    green: "bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-100",
    blue: "bg-blue-100 text-blue-700 dark:bg-sky-500/15 dark:text-sky-200",
    purple: "bg-purple-100 text-purple-700 dark:bg-violet-500/15 dark:text-violet-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
