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
  Pencil,
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
  onRevise?: (findingId: string, correctedValue: string, scope: "case" | "firm") => void;
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
  revised: <Pencil className="h-4 w-4 text-violet-500" />,
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

function ScopeToggle({
  value,
  onChange,
}: {
  value: "case" | "firm";
  onChange: (v: "case" | "firm") => void;
}) {
  return (
    <div className="flex rounded-full bg-slate-100 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange("case")}
        className={`px-3 py-1 rounded-full transition-colors ${
          value === "case" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
        }`}
      >
        This case
      </button>
      <button
        type="button"
        onClick={() => onChange("firm")}
        className={`px-3 py-1 rounded-full transition-colors ${
          value === "firm" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
        }`}
      >
        All cases
      </button>
    </div>
  );
}

function FindingCard({
  finding,
  onResolve,
  onRevise,
  isResolving,
}: {
  finding: Finding;
  onResolve?: FindingsPanelProps["onResolve"];
  onRevise?: FindingsPanelProps["onRevise"];
  isResolving?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedValue, setCorrectedValue] = useState("");
  const [correctionScope, setCorrectionScope] = useState<"case" | "firm">("case");
  const [conflictChoice, setConflictChoice] = useState<"new" | "existing" | "custom">("new");
  const impact = IMPACT_STYLES[finding.impact] || IMPACT_STYLES.info;
  const confidence = parseFloat(finding.confidence);

  const handleReviseSubmit = () => {
    if (!onRevise || !correctedValue.trim()) return;
    onRevise(finding.id, correctedValue.trim(), correctionScope);
    setShowCorrection(false);
    setCorrectedValue("");
  };

  const handleConflictResolve = () => {
    if (!onRevise) return;
    if (conflictChoice === "new") {
      // Accept the new extracted value as-is
      onResolve?.(finding.id, "accepted");
    } else if (conflictChoice === "existing") {
      // Revise back to existing value
      if (!finding.existingValue) return;
      onRevise(finding.id, finding.existingValue, correctionScope);
    } else {
      // Custom value — use the correction form
      onRevise(finding.id, correctedValue.trim(), correctionScope);
    }
  };

  const isActionable = finding.status === "pending" || finding.status === "conflict";

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

          {/* Conflict resolution UI */}
          {finding.status === "conflict" && finding.existingValue && onRevise && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-orange-700">Resolve conflict:</div>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`conflict-${finding.id}`}
                  checked={conflictChoice === "new"}
                  onChange={() => setConflictChoice("new")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Use new value:</span> {finding.value}
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`conflict-${finding.id}`}
                  checked={conflictChoice === "existing"}
                  onChange={() => setConflictChoice("existing")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Keep existing:</span> {finding.existingValue}
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`conflict-${finding.id}`}
                  checked={conflictChoice === "custom"}
                  onChange={() => setConflictChoice("custom")}
                  className="mt-0.5"
                />
                <span className="font-medium">Enter custom value</span>
              </label>
              {conflictChoice === "custom" && (
                <input
                  type="text"
                  value={correctedValue}
                  onChange={(e) => setCorrectedValue(e.target.value)}
                  placeholder="Enter corrected value..."
                  className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="flex items-center gap-2 pt-1">
                <ScopeToggle value={correctionScope} onChange={setCorrectionScope} />
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConflictResolve();
                  }}
                  disabled={isResolving || (conflictChoice === "custom" && !correctedValue.trim())}
                >
                  Resolve
                </Button>
              </div>
            </div>
          )}

          {/* Existing value display for non-interactive conflict view */}
          {finding.status === "conflict" && finding.existingValue && !onRevise && (
            <div className="text-xs bg-orange-50 rounded p-2 border-l-2 border-orange-300 text-orange-700">
              <span className="font-medium">Existing value:</span> {finding.existingValue}
            </div>
          )}

          {/* Action buttons for pending findings */}
          {finding.status === "pending" && (onResolve || onRevise) && (
            <div className="flex gap-2 pt-1">
              {onResolve && (
                <>
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
                </>
              )}
              {onRevise && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-violet-700 border-violet-300 hover:bg-violet-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCorrection(!showCorrection);
                    if (!correctedValue) setCorrectedValue(finding.value || "");
                  }}
                  disabled={isResolving}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Correct
                </Button>
              )}
            </div>
          )}

          {/* Inline correction form */}
          {showCorrection && finding.status === "pending" && onRevise && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <input
                type="text"
                value={correctedValue}
                onChange={(e) => setCorrectedValue(e.target.value)}
                placeholder="Enter corrected value..."
                className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <ScopeToggle value={correctionScope} onChange={setCorrectionScope} />
                <Button
                  size="sm"
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReviseSubmit();
                  }}
                  disabled={isResolving || !correctedValue.trim()}
                >
                  Save Correction
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCorrection(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FindingsPanel({ findings, onResolve, onRevise, isResolving }: FindingsPanelProps) {
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
                onRevise={onRevise}
                isResolving={isResolving}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
