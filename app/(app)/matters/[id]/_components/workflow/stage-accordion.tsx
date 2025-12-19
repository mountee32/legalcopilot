"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Lock, AlertTriangle, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WorkflowTaskRow, type WorkflowTask } from "./workflow-task-row";
import { TABLE_GRID_CLASSES } from "./workflow-table";
import { cn } from "@/lib/utils";

export interface WorkflowStage {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  gateType: "hard" | "soft" | "none";
  completionCriteria: string;
  skippedReason?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  totalTasks: number;
  completedTasks: number;
  mandatoryTasks: number;
  completedMandatoryTasks: number;
  tasks: WorkflowTask[];
}

interface StageAccordionProps {
  stage: WorkflowStage;
  matterId: string;
  isCurrentStage: boolean;
  previousStageComplete: boolean;
  onTaskUpdated: () => void;
}

const statusConfig = {
  completed: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    icon: Check,
    label: "Completed",
  },
  in_progress: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    icon: null,
    label: "In Progress",
  },
  pending: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-500",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    icon: null,
    label: "Pending",
  },
  skipped: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-400",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-400",
    icon: SkipForward,
    label: "Skipped",
  },
};

export function StageAccordion({
  stage,
  matterId,
  isCurrentStage,
  previousStageComplete,
  onTaskUpdated,
}: StageAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(isCurrentStage || stage.status === "in_progress");

  const config = statusConfig[stage.status];
  const StatusIcon = config.icon;

  // Calculate progress percentage
  const progress =
    stage.mandatoryTasks > 0
      ? Math.round((stage.completedMandatoryTasks / stage.mandatoryTasks) * 100)
      : stage.totalTasks > 0
        ? Math.round((stage.completedTasks / stage.totalTasks) * 100)
        : 0;

  // Check if stage is blocked by a hard gate
  const isBlockedByGate =
    stage.gateType === "hard" && !previousStageComplete && stage.status === "pending";

  // Check if any tasks are blocked
  const hasBlockedTasks = stage.tasks.some((t) => t.isBlocked);

  // Determine remarks content
  const remarksContent =
    stage.status === "skipped"
      ? stage.skippedReason || "Stage skipped"
      : hasBlockedTasks
        ? `${stage.tasks.filter((t) => t.isBlocked).length} task${stage.tasks.filter((t) => t.isBlocked).length > 1 ? "s" : ""} blocked`
        : `${stage.completedMandatoryTasks}/${stage.mandatoryTasks} mandatory`;

  // Determine visual status for badge
  const visualStatus = isBlockedByGate ? "blocked" : stage.status;

  return (
    <div className="group">
      {/* Stage Header Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          TABLE_GRID_CLASSES,
          "w-full items-center px-4 py-3 text-left",
          "hover:bg-slate-100/50 transition-colors",
          isExpanded && "bg-slate-100/30",
          isBlockedByGate && "bg-red-50/50"
        )}
      >
        {/* Name Column */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}

          {/* Status Icon */}
          <div
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
              stage.status === "completed"
                ? "bg-emerald-100"
                : stage.status === "skipped"
                  ? "bg-slate-100"
                  : isBlockedByGate
                    ? "bg-red-100"
                    : "bg-slate-100"
            )}
          >
            {StatusIcon ? (
              <StatusIcon
                className={cn(
                  "w-3.5 h-3.5",
                  stage.status === "completed" ? "text-emerald-600" : "text-slate-400"
                )}
              />
            ) : isBlockedByGate ? (
              <Lock className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <span className={cn("text-xs font-semibold", config.text)}>
                {stage.completedMandatoryTasks}
              </span>
            )}
          </div>

          {/* Stage Name */}
          <span
            className={cn(
              "font-medium truncate",
              stage.status === "skipped" ? "text-slate-400" : "text-slate-900"
            )}
          >
            {stage.name}
          </span>

          {/* Gate Icons */}
          {stage.gateType === "hard" && (
            <span
              title="Hard Gate - Previous stage must be completed before this stage can begin"
              className="flex-shrink-0 text-red-600"
            >
              <Lock className="w-4 h-4" />
            </span>
          )}
          {stage.gateType === "soft" && (
            <span
              title="Soft Gate - Previous stage should be completed, but this stage can proceed with warnings"
              className="flex-shrink-0 text-amber-600"
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
          )}

          {/* Current Stage Indicator */}
          {isCurrentStage && stage.status !== "completed" && (
            <Badge className="text-xs flex-shrink-0">Current</Badge>
          )}
        </div>

        {/* Status Column */}
        <div className="flex items-center">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              visualStatus === "blocked"
                ? "bg-red-100 text-red-700 border-red-200"
                : cn(config.badgeBg, config.badgeText, config.border)
            )}
          >
            {visualStatus === "blocked" ? "Blocked" : config.label}
          </Badge>
        </div>

        {/* Progress Column */}
        <div className="flex items-center gap-2">
          {stage.status !== "skipped" && (
            <>
              <Progress
                value={progress}
                className={cn(
                  "flex-1 h-2",
                  stage.status === "completed" && "[&>div]:bg-emerald-500"
                )}
              />
              <span className={cn("text-xs font-medium w-8", config.text)}>{progress}%</span>
            </>
          )}
        </div>

        {/* Remarks Column */}
        <div className="flex items-center min-w-0">
          <span
            className={cn(
              "text-sm truncate",
              hasBlockedTasks && stage.status !== "completed" ? "text-amber-600" : "text-slate-500"
            )}
          >
            {hasBlockedTasks && stage.status !== "completed" && (
              <AlertTriangle className="w-3 h-3 inline mr-1" />
            )}
            {remarksContent}
          </span>
        </div>

        {/* Actions Column */}
        <div className="flex items-center justify-end">{/* Future: Stage skip button, etc. */}</div>
      </button>

      {/* Gate Blocked Message */}
      {isExpanded && isBlockedByGate && (
        <div className="px-4 py-2 bg-red-50 border-y border-red-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">
            This stage is blocked until the previous stage is complete
          </span>
        </div>
      )}

      {/* Tasks List */}
      {isExpanded && stage.tasks.length > 0 && (
        <div className="bg-white border-t border-slate-100">
          {stage.tasks.map((task) => (
            <WorkflowTaskRow
              key={task.id}
              task={task}
              matterId={matterId}
              disabled={isBlockedByGate || stage.status === "skipped"}
              onTaskUpdated={onTaskUpdated}
              isNested={true}
            />
          ))}
        </div>
      )}

      {/* Empty Tasks State */}
      {isExpanded && stage.tasks.length === 0 && stage.status !== "skipped" && (
        <div className="px-4 py-6 bg-white border-t border-slate-100 text-center text-sm text-slate-500">
          No tasks in this stage
        </div>
      )}
    </div>
  );
}
