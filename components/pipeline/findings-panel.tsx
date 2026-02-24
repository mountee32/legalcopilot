"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Finding {
  id: string;
  categoryKey: string;
  fieldKey: string;
  label: string;
  value: string | null;
  sourceQuote: string | null;
  confidence: string;
  impact: string;
  status: string;
  existingValue: string | null;
}

interface FindingsPanelProps {
  findings: Finding[];
  onResolve?: (findingId: string, status: "accepted" | "rejected") => void;
  isResolving?: boolean;
}

const IMPACT_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  low: { bg: "bg-blue-100", text: "text-blue-700" },
  info: { bg: "bg-slate-100", text: "text-slate-600" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  accepted: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  auto_applied: <Zap className="h-4 w-4 text-blue-500" />,
  conflict: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500">{pct}%</span>
    </div>
  );
}

function FindingCard({
  finding,
  onResolve,
  isResolving,
}: {
  finding: Finding;
  onResolve?: FindingsPanelProps["onResolve"];
  isResolving?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const impact = IMPACT_STYLES[finding.impact] || IMPACT_STYLES.info;
  const confidence = parseFloat(finding.confidence);

  return (
    <div className="border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {STATUS_ICONS[finding.status] || STATUS_ICONS.pending}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 truncate">{finding.label}</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${impact.bg} ${impact.text} border-0`}
            >
              {finding.impact}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-slate-600 truncate">{finding.value || "—"}</span>
            <ConfidenceBar confidence={confidence} />
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="mt-3 ml-6 space-y-2">
          <div className="text-xs text-slate-500">
            <span className="font-medium">Field:</span> {finding.categoryKey}.{finding.fieldKey}
          </div>

          {finding.sourceQuote && (
            <div className="text-xs bg-slate-50 rounded p-2 border-l-2 border-blue-300 text-slate-600 italic">
              &ldquo;{finding.sourceQuote}&rdquo;
            </div>
          )}

          {finding.status === "conflict" && finding.existingValue && (
            <div className="text-xs bg-orange-50 rounded p-2 border-l-2 border-orange-300 text-orange-700">
              <span className="font-medium">Existing value:</span> {finding.existingValue}
            </div>
          )}

          {finding.status === "pending" && onResolve && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(finding.id, "accepted");
                }}
                disabled={isResolving}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(finding.id, "rejected");
                }}
                disabled={isResolving}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FindingsPanel({ findings, onResolve, isResolving }: FindingsPanelProps) {
  // Group by category
  const byCategory = new Map<string, Finding[]>();
  for (const f of findings) {
    const bucket = byCategory.get(f.categoryKey) || [];
    bucket.push(f);
    byCategory.set(f.categoryKey, bucket);
  }

  if (findings.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-slate-400">No findings extracted yet</Card>
    );
  }

  const pendingCount = findings.filter((f) => f.status === "pending").length;
  const conflictCount = findings.filter((f) => f.status === "conflict").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Findings ({findings.length})</h3>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
            >
              {pendingCount} pending
            </Badge>
          )}
          {conflictCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-orange-50 text-orange-700 border-orange-200"
            >
              {conflictCount} conflicts
            </Badge>
          )}
        </div>
      </div>

      {Array.from(byCategory.entries()).map(([categoryKey, categoryFindings]) => (
        <div key={categoryKey}>
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            {categoryKey.replace(/_/g, " ")}
          </h4>
          <div className="space-y-2">
            {categoryFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onResolve={onResolve}
                isResolving={isResolving}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
