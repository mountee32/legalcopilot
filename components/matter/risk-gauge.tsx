"use client";

import type { RiskFactor } from "@/lib/pipeline/risk-score";

interface RiskGaugeProps {
  score: number | null;
  factors: RiskFactor[] | null;
  assessedAt: string | null;
}

function getScoreConfig(score: number) {
  if (score >= 70) {
    return { label: "High Risk", color: "text-red-600", markerColor: "bg-red-600" };
  }
  if (score >= 40) {
    return { label: "Medium Risk", color: "text-amber-600", markerColor: "bg-amber-600" };
  }
  return { label: "Low Risk", color: "text-emerald-600", markerColor: "bg-emerald-600" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function RiskGauge({ score, factors, assessedAt }: RiskGaugeProps) {
  if (score === null || score === undefined) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl font-light text-slate-300 mb-1">--</div>
        <p className="text-xs text-slate-400">Not yet assessed</p>
      </div>
    );
  }

  const config = getScoreConfig(score);
  const sortedFactors = factors ? [...factors].sort((a, b) => b.contribution - a.contribution) : [];

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tabular-nums ${config.color}`}>{score}</span>
        <span className="text-sm text-slate-500">/100</span>
        <span className={`ml-auto text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>

      {/* Segmented bar */}
      <div className="relative">
        <div className="flex h-2 rounded-full overflow-hidden">
          <div className="bg-emerald-400 flex-[40]" />
          <div className="bg-amber-400 flex-[30]" />
          <div className="bg-red-400 flex-[30]" />
        </div>
        {/* Score marker */}
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${Math.min(score, 100)}%` }}
        >
          <div
            className={`w-3 h-3 rounded-full border-2 border-white shadow ${config.markerColor}`}
          />
        </div>
      </div>

      {/* Factor breakdown */}
      {sortedFactors.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Risk Factors
          </h4>
          {sortedFactors.map((factor) => (
            <div key={factor.key} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 truncate">{factor.label}</span>
              <span className="text-xs font-mono font-medium text-slate-500 shrink-0">
                +{factor.contribution}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Assessed date */}
      {assessedAt && (
        <p className="text-[10px] text-slate-400 pt-1">Last assessed {formatDate(assessedAt)}</p>
      )}
    </div>
  );
}
