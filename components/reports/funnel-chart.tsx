"use client";

import type { FunnelReport } from "@/lib/hooks/use-reports-data";

interface FunnelChartProps {
  data: FunnelReport;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-blue-400",
  qualified: "bg-indigo-500",
  proposal_sent: "bg-violet-500",
  negotiating: "bg-purple-500",
  won: "bg-green-500",
  lost: "bg-red-400",
  disqualified: "bg-slate-400",
};

export function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = Math.max(...data.byStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelKpi label="Total Leads" value={data.totalLeads} />
        <FunnelKpi label="Won" value={data.wonLeads} />
        <FunnelKpi label="Lost" value={data.lostLeads} />
        <FunnelKpi label="Conversion Rate" value={`${Math.round(data.conversionRate * 100)}%`} />
      </div>

      {/* Funnel bars */}
      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Lead Funnel</h3>
          <p className="text-xs text-slate-500">
            Avg {data.avgTimeToConvert.toFixed(1)} days to convert
          </p>
        </div>
        <div className="space-y-2">
          {data.byStatus.map((stage) => (
            <div key={stage.status} className="flex items-center gap-3">
              <span className="w-28 text-xs text-slate-600 text-right capitalize truncate">
                {stage.status.replace(/_/g, " ")}
              </span>
              <div className="flex-1 h-7 bg-slate-100 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all flex items-center px-2 ${
                    STATUS_COLORS[stage.status] ?? "bg-slate-400"
                  }`}
                  style={{ width: `${Math.max((stage.count / maxCount) * 100, 4)}%` }}
                >
                  <span className="text-[11px] font-medium text-white">{stage.count}</span>
                </div>
              </div>
              <span className="w-12 text-xs text-slate-500 text-right">
                {stage.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
