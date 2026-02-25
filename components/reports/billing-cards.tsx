"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { BillingReport } from "@/lib/hooks/use-reports-data";

interface BillingCardsProps {
  data: BillingReport;
}

export function BillingCards({ data }: BillingCardsProps) {
  const wipData = [
    { name: "Draft", value: parseFloat(data.wip.draft) },
    { name: "Submitted", value: parseFloat(data.wip.submitted) },
    { name: "Approved", value: parseFloat(data.wip.approved) },
  ];

  const debtData = [
    { name: "0-30d", value: parseFloat(data.agedDebt.current) },
    { name: "31-60d", value: parseFloat(data.agedDebt.days31to60) },
    { name: "61-90d", value: parseFloat(data.agedDebt.days61to90) },
    { name: "90d+", value: parseFloat(data.agedDebt.days90plus) },
  ];

  const revenueData = [
    { name: "Paid", value: parseFloat(data.revenue.paid) },
    { name: "Outstanding", value: parseFloat(data.revenue.outstanding) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* WIP Breakdown */}
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Work in Progress</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{formatMoney(data.wip.total)}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={wipData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={shortMoney} />
            <Tooltip formatter={(v: number) => formatMoney(String(v))} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aged Debt */}
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Aged Debt</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{formatMoney(data.agedDebt.total)}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={debtData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={shortMoney} />
            <Tooltip formatter={(v: number) => formatMoney(String(v))} />
            <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue */}
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Revenue</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{formatMoney(data.revenue.total)}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={shortMoney} />
            <Tooltip formatter={(v: number) => formatMoney(String(v))} />
            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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

function shortMoney(val: number): string {
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return String(val);
}
