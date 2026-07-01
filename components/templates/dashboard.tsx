import * as React from "react";
import { DashboardHeader } from "@/components/sections/dashboard/dashboard-header";
import { DashboardTabs } from "@/components/sections/dashboard/dashboard-tabs";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <DashboardHeader />
        <DashboardTabs />
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
