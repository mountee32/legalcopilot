"use client";

import { Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}

function KpiCard({ label, value, icon, subtitle }: KpiCardProps) {
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

interface KpiStripProps {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  avgDurationSeconds: number | null;
  totalFindings: number;
  avgConfidence: number | null;
  highRiskCount: number;
  mattersWithRisk: number;
}

export function KpiStrip({
  totalRuns,
  completedRuns,
  failedRuns,
  avgDurationSeconds,
  totalFindings,
  avgConfidence,
  highRiskCount,
  mattersWithRisk,
}: KpiStripProps) {
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  const avgDuration =
    avgDurationSeconds != null
      ? avgDurationSeconds < 60
        ? `${avgDurationSeconds}s`
        : `${Math.round(avgDurationSeconds / 60)}m`
      : "—";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Pipeline Runs"
        value={totalRuns}
        icon={<Activity className="h-5 w-5 text-blue-600" />}
        subtitle={`${successRate}% success rate`}
      />
      <KpiCard
        label="Findings Extracted"
        value={totalFindings}
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        subtitle={
          avgConfidence != null ? `${Math.round(avgConfidence * 100)}% avg confidence` : undefined
        }
      />
      <KpiCard
        label="High Risk Matters"
        value={highRiskCount}
        icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        subtitle={`of ${mattersWithRisk} scored`}
      />
      <KpiCard
        label="Avg Processing Time"
        value={avgDuration}
        icon={<Clock className="h-5 w-5 text-violet-600" />}
        subtitle={failedRuns > 0 ? `${failedRuns} failed` : "no failures"}
      />
    </div>
  );
}
