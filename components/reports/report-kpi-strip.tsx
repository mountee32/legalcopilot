"use client";

import { Briefcase, PoundSterling, FileText, AlertTriangle } from "lucide-react";
import type { DashboardReport } from "@/lib/hooks/use-reports-data";

interface ReportKpiStripProps {
  data: DashboardReport;
}

export function ReportKpiStrip({ data }: ReportKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Active Matters"
        value={data.activeMatters}
        icon={<Briefcase className="h-5 w-5 text-blue-600" />}
        subtitle={`${data.pendingTasks} pending tasks`}
      />
      <KpiCard
        label="Revenue"
        value={formatMoney(data.totalRevenue)}
        icon={<PoundSterling className="h-5 w-5 text-green-600" />}
        subtitle={`${formatMoney(data.totalWip)} WIP`}
      />
      <KpiCard
        label="Outstanding Invoices"
        value={data.outstandingInvoices}
        icon={<FileText className="h-5 w-5 text-amber-600" />}
        subtitle={`${data.overdueTasks} overdue tasks`}
      />
      <KpiCard
        label="Overdue Debt"
        value={formatMoney(data.overdueDebt)}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 truncate">{label}</p>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function formatMoney(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
