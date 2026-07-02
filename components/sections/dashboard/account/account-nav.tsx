"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/client/util";

const tabs = [
  { href: "/dashboard/account/profile", labelKey: "account.tabs.profile" },
  { href: "/dashboard/account/security", labelKey: "account.tabs.security" },
  { href: "/dashboard/account/billing", labelKey: "account.tabs.billing" },
  { href: "/dashboard/account/team", labelKey: "account.tabs.team" },
];

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="scroll-thin flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-sm font-medium transition",
              active ? "text-indigo-600 dark:text-indigo-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            )}
          >
            {t(tab.labelKey)}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-300" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
