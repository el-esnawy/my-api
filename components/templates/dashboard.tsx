import * as React from "react";
import { DashboardHeader } from "@/components/sections/dashboard/dashboard-header";
import { DashboardTabs } from "@/components/sections/dashboard/dashboard-tabs";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <DashboardHeader />
        <DashboardTabs />
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
