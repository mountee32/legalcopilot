"use client";

import { Badge } from "@/components/ui/badge";
import { CheckSquare, AlertTriangle, Shield, FileCheck, Clock } from "lucide-react";

interface WorkflowTaskRowProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    isMandatory: boolean;
    requiresEvidence: boolean;
    requiresApproval: boolean;
    defaultPriority: string;
    dueDateRelativeTo: string | null;
    dueDateOffsetDays: number | null;
    sortOrder: number;
  };
  showDetails?: boolean;
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-100 border-red-200 text-red-700",
    high: "bg-orange-100 border-orange-200 text-orange-700",
    medium: "bg-amber-100 border-amber-200 text-amber-700",
    low: "bg-slate-100 border-slate-200 text-slate-600",
  };
  return colors[priority] || "bg-slate-100 border-slate-200 text-slate-600";
}

function formatDueDateOffset(relativeTo: string | null, offsetDays: number | null): string | null {
  if (!relativeTo || offsetDays === null) return null;

  const relativeLabels: Record<string, string> = {
    matter_created: "matter creation",
    stage_started: "stage start",
    previous_task: "previous task",
    exchange_date: "exchange date",
    completion_date: "completion date",
    court_date: "court date",
    filing_deadline: "filing deadline",
  };

  const label = relativeLabels[relativeTo] || relativeTo;
  if (offsetDays === 0) return `On ${label}`;
  if (offsetDays > 0) return `${offsetDays}d after ${label}`;
  return `${Math.abs(offsetDays)}d before ${label}`;
}

export function WorkflowTaskRow({ task, showDetails = false }: WorkflowTaskRowProps) {
  const dueDateLabel = formatDueDateOffset(task.dueDateRelativeTo, task.dueDateOffsetDays);

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
      {/* Task number */}
      <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-xs font-mono text-slate-600">
        {task.sortOrder}
      </div>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-900">{task.title}</span>

          {/* Mandatory indicator */}
          {task.isMandatory && (
            <Badge
              variant="outline"
              className="bg-red-100 border-red-200 text-red-700 text-xs gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Required
            </Badge>
          )}

          {/* Evidence required */}
          {task.requiresEvidence && (
            <Badge
              variant="outline"
              className="bg-blue-100 border-blue-200 text-blue-700 text-xs gap-1"
            >
              <FileCheck className="h-3 w-3" />
              Evidence
            </Badge>
          )}

          {/* Approval required */}
          {task.requiresApproval && (
            <Badge
              variant="outline"
              className="bg-purple-100 border-purple-200 text-purple-700 text-xs gap-1"
            >
              <Shield className="h-3 w-3" />
              Approval
            </Badge>
          )}

          {/* Priority */}
          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.defaultPriority)}`}>
            {task.defaultPriority}
          </Badge>
        </div>

        {/* Description (if showDetails) */}
        {showDetails && task.description && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{task.description}</p>
        )}

        {/* Due date info */}
        {dueDateLabel && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            <span>{dueDateLabel}</span>
          </div>
        )}
      </div>

      {/* Icon */}
      <div className="p-1.5 bg-slate-100 rounded">
        <CheckSquare className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}
