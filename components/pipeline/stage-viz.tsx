"use client";

import { CheckCircle2, Circle, Loader2, XCircle, SkipForward } from "lucide-react";

const STAGES = [
  { key: "intake", label: "Intake", description: "Validate & dedup" },
  { key: "ocr", label: "OCR", description: "Extract text" },
  { key: "classify", label: "Classify", description: "Document type" },
  { key: "extract", label: "Extract", description: "Find data" },
  { key: "reconcile", label: "Reconcile", description: "Match & verify" },
  { key: "actions", label: "Actions", description: "Generate tasks" },
] as const;

interface StageStatus {
  status: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface StageVizProps {
  currentStage: string | null;
  stageStatuses: Record<string, StageStatus>;
  runStatus: string;
}

function getStageIcon(status: string | undefined, isCurrent: boolean) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "running":
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "skipped":
      return <SkipForward className="h-5 w-5 text-slate-400" />;
    default:
      return <Circle className={`h-5 w-5 ${isCurrent ? "text-blue-300" : "text-slate-300"}`} />;
  }
}

function getStageClasses(status: string | undefined) {
  switch (status) {
    case "completed":
      return "border-green-200 bg-green-50";
    case "running":
      return "border-blue-200 bg-blue-50 ring-2 ring-blue-200";
    case "failed":
      return "border-red-200 bg-red-50";
    case "skipped":
      return "border-slate-200 bg-slate-50 opacity-60";
    default:
      return "border-slate-200 bg-white";
  }
}

function formatDuration(startedAt?: string, completedAt?: string): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const ms = end - start;

  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function StageViz({ currentStage, stageStatuses, runStatus }: StageVizProps) {
  return (
    <div className="flex items-start gap-2 overflow-x-auto pb-2">
      {STAGES.map((stage, idx) => {
        const status = stageStatuses[stage.key];
        const isCurrent = currentStage === stage.key;
        const duration = formatDuration(status?.startedAt, status?.completedAt);

        return (
          <div key={stage.key} className="flex items-center">
            <div
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border min-w-[80px] transition-all ${getStageClasses(status?.status)}`}
            >
              {getStageIcon(status?.status, isCurrent)}
              <span className="text-xs font-medium text-slate-700">{stage.label}</span>
              <span className="text-[10px] text-slate-400">
                {status?.status === "running"
                  ? "Processing..."
                  : status?.status === "failed"
                    ? "Failed"
                    : duration || stage.description}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`w-4 h-0.5 mx-0.5 ${
                  status?.status === "completed" ? "bg-green-300" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
