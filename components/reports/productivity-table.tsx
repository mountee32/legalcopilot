"use client";

import type { ProductivityReport } from "@/lib/hooks/use-reports-data";

interface ProductivityTableProps {
  data: ProductivityReport;
}

export function ProductivityTable({ data }: ProductivityTableProps) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-5 py-3 border-b">
        <h3 className="text-sm font-semibold text-slate-900">Fee Earner Productivity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-4 py-2 font-medium text-slate-600">Name</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Billable</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Total</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Utilisation</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Revenue</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Matters</th>
            </tr>
          </thead>
          <tbody>
            {data.feeEarners.map((fe) => (
              <tr key={fe.feeEarnerId} className="border-b last:border-b-0 hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{fe.feeEarnerName}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">
                  {fe.billableHours.toFixed(1)}h
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">
                  {fe.totalHours.toFixed(1)}h
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={
                      fe.utilisation >= 0.8
                        ? "text-green-700"
                        : fe.utilisation >= 0.6
                          ? "text-amber-700"
                          : "text-red-700"
                    }
                  >
                    {Math.round(fe.utilisation * 100)}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{formatMoney(fe.revenue)}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{fe.activeMatters}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-medium">
              <td className="px-4 py-2.5 text-slate-900">Total</td>
              <td className="px-4 py-2.5 text-right text-slate-900">
                {data.summary.totalBillableHours.toFixed(1)}h
              </td>
              <td className="px-4 py-2.5 text-right text-slate-900">
                {data.summary.totalHours.toFixed(1)}h
              </td>
              <td className="px-4 py-2.5 text-right text-slate-900">
                {Math.round(data.summary.avgUtilisation * 100)}%
              </td>
              <td className="px-4 py-2.5 text-right text-slate-900">
                {formatMoney(data.summary.totalRevenue)}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-600">—</td>
            </tr>
          </tfoot>
        </table>
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
