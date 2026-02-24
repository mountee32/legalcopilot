"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ExtractionQualityResponse } from "@/lib/api/schemas/analytics";

const STATUS_COLORS: Record<string, string> = {
  accepted: "#22c55e",
  auto_applied: "#3b82f6",
  pending: "#f59e0b",
  rejected: "#ef4444",
  conflict: "#8b5cf6",
};

interface ExtractionChartsProps {
  data: ExtractionQualityResponse;
}

export function ExtractionCharts({ data }: ExtractionChartsProps) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Extraction Quality</h3>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Findings by status (pie) */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Findings by Status</p>
          {data.findingsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.findingsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={false}
                  fontSize={11}
                >
                  {data.findingsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Confidence distribution (bar) */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Confidence Distribution</p>
          {data.confidenceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" name="Findings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Top categories (horizontal bar) */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Top Categories</p>
          {data.topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.topCategories.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={100}
                  tickFormatter={(v) => v.replace(/_/g, " ")}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" name="Findings" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
      No findings in this period
    </div>
  );
}
