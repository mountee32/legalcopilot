"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Lock, AlertTriangle, SkipForward } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WorkflowTaskRow, type WorkflowTask } from "./workflow-task-row";

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
  isCurrentStage: boolean;
  previousStageComplete: boolean;
  onTaskUpdated: () => void;
}

const statusConfig = {
  completed: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: Check,
  },
  in_progress: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: null,
  },
  pending: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-500",
    icon: null,
  },
  skipped: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-400",
    icon: SkipForward,
  },
};

export function StageAccordion({
  stage,
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

  return (
    <Card className={`overflow-hidden ${config.border} ${isBlockedByGate ? "border-red-200" : ""}`}>
      {/* Stage Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors ${
          config.bg
        } ${isBlockedByGate ? "bg-red-50" : ""}`}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}

          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              stage.status === "completed"
                ? "bg-emerald-100"
                : stage.status === "skipped"
                  ? "bg-slate-100"
                  : isBlockedByGate
                    ? "bg-red-100"
                    : "bg-slate-100"
            }`}
          >
            {StatusIcon ? (
              <StatusIcon
                className={`w-4 h-4 ${
                  stage.status === "completed" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
            ) : isBlockedByGate ? (
              <Lock className="w-4 h-4 text-red-500" />
            ) : (
              <span className={`text-sm font-semibold ${config.text}`}>
                {stage.completedMandatoryTasks}
              </span>
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <h4
                className={`font-medium ${
                  stage.status === "skipped" ? "text-slate-400 line-through" : "text-slate-900"
                }`}
              >
                {stage.name}
              </h4>

              {/* Gate Badge */}
              {stage.gateType === "hard" && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  <Lock className="w-3 h-3 mr-1" />
                  Hard Gate
                </Badge>
              )}
              {stage.gateType === "soft" && (
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Soft Gate
                </Badge>
              )}

              {/* Current Stage Indicator */}
              {isCurrentStage && stage.status !== "completed" && (
                <Badge className="text-xs">Current</Badge>
              )}

              {/* Blocked Tasks Warning */}
              {hasBlockedTasks && stage.status !== "completed" && (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>

            <p className="text-sm text-slate-500">
              {stage.status === "skipped"
                ? stage.skippedReason || "Stage skipped"
                : `${stage.completedMandatoryTasks} of ${stage.mandatoryTasks} mandatory tasks`}
            </p>
          </div>
        </div>

        {/* Progress */}
        {stage.status !== "skipped" && (
          <div className="flex items-center gap-3">
            <div className="w-24">
              <Progress
                value={progress}
                className={`h-2 ${stage.status === "completed" ? "[&>div]:bg-emerald-500" : ""}`}
              />
            </div>
            <span className={`text-sm font-semibold ${config.text} w-10`}>{progress}%</span>
          </div>
        )}
      </button>

      {/* Gate Blocked Message */}
      {isExpanded && isBlockedByGate && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">
            This stage is blocked until the previous stage is complete
          </span>
        </div>
      )}

      {/* Tasks List */}
      {isExpanded && stage.tasks.length > 0 && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-200">
          <div className="space-y-2">
            {stage.tasks.map((task) => (
              <WorkflowTaskRow
                key={task.id}
                task={task}
                disabled={isBlockedByGate || stage.status === "skipped"}
                onTaskUpdated={onTaskUpdated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty Tasks State */}
      {isExpanded && stage.tasks.length === 0 && stage.status !== "skipped" && (
        <div className="px-4 py-6 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
          No tasks in this stage
        </div>
      )}
    </Card>
  );
}
