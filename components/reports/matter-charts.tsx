"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MatterSummaryReport } from "@/lib/hooks/use-reports-data";

interface MatterChartsProps {
  data: MatterSummaryReport;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  active: "#22c55e",
  pending: "#f59e0b",
  closed: "#6b7280",
  archived: "#94a3b8",
};

export function MatterCharts({ data }: MatterChartsProps) {
  const statusData = data.byStatus.map((s) => ({
    name: s.status.replace(/_/g, " "),
    count: s.count,
    fill: STATUS_COLORS[s.status] ?? "#6b7280",
  }));

  const areaData = data.byPracticeArea.map((a) => ({
    name: a.practiceArea.replace(/_/g, " "),
    count: a.count,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* By Status */}
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Matters by Status</h3>
        <p className="text-xs text-slate-500 mb-3">{data.total} total matters</p>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={80}
                className="capitalize"
              />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* By Practice Area */}
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Matters by Practice Area</h3>
        <p className="text-xs text-slate-500 mb-3">Distribution across areas</p>
        {areaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={areaData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={120}
                className="capitalize"
              />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
      No data for this period
    </div>
  );
}
