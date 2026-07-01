"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/client/util";

const tabs = [
  { href: "/dashboard/schemas", label: "Schemas" },
  { href: "/dashboard/entries", label: "Entries" },
  { href: "/dashboard/endpoints", label: "Endpoints" },
  { href: "/dashboard/tokens", label: "Request Tokens" },
];

export function DashboardTabs() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 px-4">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition",
              active ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
