"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PipelineHealthResponse } from "@/lib/api/schemas/analytics";

interface PipelineChartsProps {
  data: PipelineHealthResponse;
}

export function PipelineCharts({ data }: PipelineChartsProps) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Health</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily run trends */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Daily Runs</p>
          {data.dailyRuns.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.dailyRuns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                <Bar dataKey="running" stackId="a" fill="#3b82f6" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Failures by stage */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Failures by Stage</p>
          {data.failuresByStage.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.failuresByStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" name="Failures" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
              No failures in this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
      No pipeline runs in this period
    </div>
  );
}
