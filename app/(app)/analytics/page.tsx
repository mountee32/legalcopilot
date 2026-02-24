"use client";

import { useState } from "react";
import { useAnalyticsData } from "@/lib/hooks/use-analytics-data";
import { KpiStrip, PipelineCharts, ExtractionCharts, RiskCharts } from "@/components/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIME_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { pipeline, extraction, risk, isLoading, isError, refetch } = useAnalyticsData(days);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="analytics-page">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-slate-700" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Operational Analytics</h1>
                <p className="text-sm text-slate-500">
                  Pipeline health, extraction quality, and risk overview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Time range picker */}
              <div className="flex rounded-lg border bg-white p-0.5">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.days}
                    onClick={() => setDays(range.days)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      days === range.days
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={refetch} className="h-8">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <AnalyticsSkeleton />
          ) : isError ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Failed to load analytics
              </h2>
              <p className="text-slate-600 mb-4">There was an error loading the analytics data.</p>
              <Button variant="outline" onClick={refetch}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              {/* KPI strip */}
              <KpiStrip
                totalRuns={pipeline?.kpis.totalRuns ?? 0}
                completedRuns={pipeline?.kpis.completedRuns ?? 0}
                failedRuns={pipeline?.kpis.failedRuns ?? 0}
                avgDurationSeconds={pipeline?.kpis.avgDurationSeconds ?? null}
                totalFindings={extraction?.kpis.totalFindings ?? 0}
                avgConfidence={extraction?.kpis.avgConfidence ?? null}
                highRiskCount={risk?.kpis.highRiskCount ?? 0}
                mattersWithRisk={risk?.kpis.mattersWithRisk ?? 0}
              />

              {/* Pipeline health section */}
              {pipeline && <PipelineCharts data={pipeline} />}

              {/* Extraction quality section */}
              {extraction && <ExtractionCharts data={extraction} />}

              {/* Risk overview section */}
              {risk && <RiskCharts data={risk} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full" />
      <Skeleton className="h-[320px] w-full" />
      <Skeleton className="h-[320px] w-full" />
    </div>
  );
}
