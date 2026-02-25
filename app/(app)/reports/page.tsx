"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardReport,
  useProductivityReport,
  useBillingReport,
  useMatterReport,
  useFunnelReport,
} from "@/lib/hooks/use-reports-data";
import {
  ReportKpiStrip,
  ProductivityTable,
  BillingCards,
  MatterCharts,
  FunnelChart,
} from "@/components/reports";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "productivity", label: "Productivity" },
  { key: "billing", label: "Billing" },
  { key: "matters", label: "Matters" },
  { key: "funnel", label: "Funnel" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PRACTICE_AREAS = [
  { value: "", label: "All Areas" },
  { value: "workers_compensation", label: "Workers Comp" },
  { value: "insurance_defense", label: "Insurance Defense" },
  { value: "personal_injury", label: "Personal Injury" },
  { value: "litigation", label: "Litigation" },
  { value: "employment", label: "Employment" },
  { value: "immigration", label: "Immigration" },
  { value: "family", label: "Family" },
  { value: "commercial", label: "Commercial" },
  { value: "criminal", label: "Criminal" },
  { value: "ip", label: "IP" },
  { value: "insolvency", label: "Insolvency" },
  { value: "conveyancing", label: "Conveyancing" },
  { value: "probate", label: "Probate" },
  { value: "other", label: "Other" },
] as const;

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [practiceArea, setPracticeArea] = useState("");

  const pa = practiceArea || undefined;
  const f = from || undefined;
  const t = to || undefined;

  const dashboard = useDashboardReport(f, t, pa, tab === "dashboard");
  const productivity = useProductivityReport(f, t, pa, tab === "productivity");
  const billing = useBillingReport(f, t, pa, tab === "billing");
  const matters = useMatterReport(f, t, pa, tab === "matters");
  const funnel = useFunnelReport(f, t, pa, tab === "funnel");

  return (
    <div className="min-h-screen bg-slate-50" data-testid="reports-page">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-slate-700" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Reports</h1>
              <p className="text-sm text-slate-500">
                Financial performance, productivity, and pipeline metrics
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-lg border bg-white p-0.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === t.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border px-2 py-1 text-xs"
                placeholder="From"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border px-2 py-1 text-xs"
                placeholder="To"
              />
              <select
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
                className="rounded-md border px-2 py-1 text-xs"
              >
                {PRACTICE_AREAS.map((pa) => (
                  <option key={pa.value} value={pa.value}>
                    {pa.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab content */}
          {tab === "dashboard" && (
            <TabContent isLoading={dashboard.isLoading} isError={dashboard.isError}>
              {dashboard.data && <ReportKpiStrip data={dashboard.data} />}
            </TabContent>
          )}

          {tab === "productivity" && (
            <TabContent isLoading={productivity.isLoading} isError={productivity.isError}>
              {productivity.data && <ProductivityTable data={productivity.data} />}
            </TabContent>
          )}

          {tab === "billing" && (
            <TabContent isLoading={billing.isLoading} isError={billing.isError}>
              {billing.data && <BillingCards data={billing.data} />}
            </TabContent>
          )}

          {tab === "matters" && (
            <TabContent isLoading={matters.isLoading} isError={matters.isError}>
              {matters.data && <MatterCharts data={matters.data} />}
            </TabContent>
          )}

          {tab === "funnel" && (
            <TabContent isLoading={funnel.isLoading} isError={funnel.isError}>
              {funnel.data && <FunnelChart data={funnel.data} />}
            </TabContent>
          )}
        </div>
      </div>
    </div>
  );
}

function TabContent({
  isLoading,
  isError,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Failed to load report data.</p>
      </div>
    );
  }
  return <>{children}</>;
}
