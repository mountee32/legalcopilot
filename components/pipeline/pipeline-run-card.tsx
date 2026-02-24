"use client";

import { FileText, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageViz } from "./stage-viz";

interface PipelineRun {
  id: string;
  documentId: string;
  status: string;
  currentStage: string | null;
  stageStatuses: Record<
    string,
    { status: string; startedAt?: string; completedAt?: string; error?: string }
  >;
  classifiedDocType: string | null;
  classificationConfidence: string | null;
  findingsCount: number;
  actionsCount: number;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

interface PipelineRunCardProps {
  run: PipelineRun;
  documentTitle?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; badge: string; badgeClass: string }> =
  {
    queued: {
      icon: <Clock className="h-4 w-4 text-slate-400" />,
      badge: "Queued",
      badgeClass: "bg-slate-100 text-slate-600",
    },
    running: {
      icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
      badge: "Running",
      badgeClass: "bg-blue-100 text-blue-700",
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      badge: "Completed",
      badgeClass: "bg-green-100 text-green-700",
    },
    failed: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      badge: "Failed",
      badgeClass: "bg-red-100 text-red-700",
    },
    cancelled: {
      icon: <XCircle className="h-4 w-4 text-slate-400" />,
      badge: "Cancelled",
      badgeClass: "bg-slate-100 text-slate-500",
    },
  };

export function PipelineRunCard({ run, documentTitle, isSelected, onClick }: PipelineRunCardProps) {
  const config = STATUS_CONFIG[run.status] || STATUS_CONFIG.queued;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-blue-500 border-blue-300" : "hover:border-slate-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 truncate">
              {documentTitle || `Document ${run.documentId.slice(0, 8)}`}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border-0 ${config.badgeClass}`}
            >
              {config.badge}
            </Badge>
          </div>

          {run.classifiedDocType && (
            <div className="text-xs text-slate-500 mb-2">
              Type: <span className="font-medium">{run.classifiedDocType.replace(/_/g, " ")}</span>
              {run.classificationConfidence && (
                <span className="text-slate-400 ml-1">
                  ({Math.round(parseFloat(run.classificationConfidence) * 100)}%)
                </span>
              )}
            </div>
          )}

          <StageViz
            currentStage={run.currentStage}
            stageStatuses={run.stageStatuses}
            runStatus={run.status}
          />

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>{run.findingsCount} findings</span>
            <span>{run.actionsCount} actions</span>
            <span>
              {new Date(run.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {run.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">{run.error}</div>
          )}
        </div>
      </div>
    </Card>
  );
}
