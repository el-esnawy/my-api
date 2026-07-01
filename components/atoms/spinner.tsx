import { cn } from "@/lib/client/util";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600",
        className
      )}
    />
  );
}
