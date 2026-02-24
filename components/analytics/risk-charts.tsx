"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RiskOverviewResponse } from "@/lib/api/schemas/analytics";

const RISK_COLORS: Record<string, string> = {
  "0-20": "#22c55e",
  "21-40": "#84cc16",
  "41-60": "#f59e0b",
  "61-80": "#f97316",
  "81-100": "#ef4444",
};

interface RiskChartsProps {
  data: RiskOverviewResponse;
}

export function RiskCharts({ data }: RiskChartsProps) {
  const distributionWithColors = data.riskDistribution.map((d) => ({
    ...d,
    fill: RISK_COLORS[d.bucket] ?? "#94a3b8",
  }));

  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Risk Overview</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk score distribution */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Risk Score Distribution</p>
          {distributionWithColors.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={distributionWithColors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Matters" radius={[4, 4, 0, 0]}>
                  {distributionWithColors.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Risk by practice area */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Average Risk by Practice Area</p>
          {data.riskByPracticeArea.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.riskByPracticeArea} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis
                  dataKey="practiceArea"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={120}
                  tickFormatter={(v) => v.replace(/_/g, " ")}
                />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} (${props?.payload?.matterCount ?? 0} matters)`,
                    name,
                  ]}
                />
                <Bar dataKey="avgScore" fill="#f97316" name="Avg Score" radius={[0, 4, 4, 0]} />
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
      No risk data available
    </div>
  );
}
