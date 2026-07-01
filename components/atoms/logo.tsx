import { cn } from "@/lib/client/util";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white",
        className
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
        <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}
