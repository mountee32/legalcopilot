"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { WorkflowTaskRow } from "./workflow-task-row";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Lock,
  Unlock,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";

interface TaskTemplate {
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
}

interface Stage {
  id: string;
  name: string;
  description: string | null;
  gateType: "hard" | "soft" | "none";
  sortOrder: number;
  tasks: TaskTemplate[];
}

interface WorkflowStageViewProps {
  stages: Stage[];
  defaultExpanded?: boolean;
}

function getGateBadge(gateType: string) {
  switch (gateType) {
    case "hard":
      return (
        <Badge variant="outline" className="bg-red-100 border-red-200 text-red-700 text-xs gap-1">
          <Lock className="h-3 w-3" />
          Hard Gate
        </Badge>
      );
    case "soft":
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 border-amber-200 text-amber-700 text-xs gap-1"
        >
          <Unlock className="h-3 w-3" />
          Soft Gate
        </Badge>
      );
    default:
      return null;
  }
}

function StageAccordion({
  stage,
  isExpanded,
  onToggle,
  stageNumber,
}: {
  stage: Stage;
  isExpanded: boolean;
  onToggle: () => void;
  stageNumber: number;
}) {
  const mandatoryCount = stage.tasks.filter((t) => t.isMandatory).length;
  const totalTasks = stage.tasks.length;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Stage header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono text-sm">
          {stageNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg text-slate-900">{stage.name}</h3>
            {getGateBadge(stage.gateType)}
          </div>
          {stage.description && (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{stage.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckSquare className="h-4 w-4 text-slate-400" />
            <span>{totalTasks}</span>
          </div>
          {mandatoryCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{mandatoryCount} required</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Tasks */}
      {isExpanded && (
        <div className="p-4 pt-0 bg-slate-50 border-t border-slate-200">
          <div className="space-y-2 pt-4">
            {stage.tasks.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                No tasks defined for this stage
              </div>
            ) : (
              stage.tasks
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((task) => <WorkflowTaskRow key={task.id} task={task} showDetails />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowStageView({ stages, defaultExpanded = false }: WorkflowStageViewProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    defaultExpanded ? new Set(stages.map((s) => s.id)) : new Set()
  );

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStages(new Set(stages.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedStages(new Set());
  };

  const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Layers className="h-4 w-4" />
          <span>{stages.length} stages</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Expand all
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {sortedStages.map((stage, index) => (
          <StageAccordion
            key={stage.id}
            stage={stage}
            isExpanded={expandedStages.has(stage.id)}
            onToggle={() => toggleStage(stage.id)}
            stageNumber={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
