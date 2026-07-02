"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/client/util";

const tabs = [
  { href: "/dashboard/schemas", labelKey: "dashboard.tabs.schemas" },
  { href: "/dashboard/entries", labelKey: "dashboard.tabs.entries" },
  { href: "/dashboard/endpoints", labelKey: "dashboard.tabs.endpoints" },
  { href: "/dashboard/tokens", labelKey: "dashboard.tabs.tokens" },
  { href: "/dashboard/account", labelKey: "dashboard.tabs.account" },
];

export function DashboardTabs() {
  const pathname = usePathname();
  const { t } = useTranslation();

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
            {t(tab.labelKey)}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
