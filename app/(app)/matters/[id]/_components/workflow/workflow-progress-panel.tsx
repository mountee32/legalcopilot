"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Workflow } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StageAccordion, type WorkflowStage } from "./stage-accordion";

interface WorkflowData {
  workflow: {
    id: string;
    currentStageId: string | null;
    template: {
      name: string;
      practiceArea: string;
    };
    stages: WorkflowStage[];
  } | null;
}

async function fetchMatterWorkflow(matterId: string): Promise<WorkflowData> {
  const res = await fetch(`/api/matters/${matterId}/workflow`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch workflow");
  return res.json();
}

interface WorkflowProgressPanelProps {
  matterId: string;
}

export function WorkflowProgressPanel({ matterId }: WorkflowProgressPanelProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["matter-workflow", matterId],
    queryFn: () => fetchMatterWorkflow(matterId),
    staleTime: 30_000,
  });

  const handleTaskUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["matter-workflow", matterId] });
    queryClient.invalidateQueries({ queryKey: ["matter-tasks", matterId] });
    queryClient.invalidateQueries({ queryKey: ["matter-timeline", matterId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8">
        <EmptyState
          title="Failed to load workflow"
          description="There was an error loading the workflow. Please try again."
          action={
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["matter-workflow", matterId] })
              }
            >
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (!data?.workflow) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No workflow activated"
          description="This matter doesn't have an active workflow. Activate a workflow to track compliance progress."
        />
      </Card>
    );
  }

  const { workflow } = data;
  const stages = workflow.stages;

  // Calculate overall progress
  const totalMandatory = stages.reduce((sum, s) => sum + s.mandatoryTasks, 0);
  const completedMandatory = stages.reduce((sum, s) => sum + s.completedMandatoryTasks, 0);
  const totalTasks = stages.reduce((sum, s) => sum + s.totalTasks, 0);
  const completedTasks = stages.reduce((sum, s) => sum + s.completedTasks, 0);

  const mandatoryProgress =
    totalMandatory > 0 ? Math.round((completedMandatory / totalMandatory) * 100) : 100;

  // Check for blocked status
  const blockedStagesCount = stages.filter((s) => s.tasks.some((t) => t.isBlocked)).length;

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Workflow className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">{workflow.template.name}</h2>
            </div>
            <p className="text-sm text-slate-500">
              {workflow.template.practiceArea.replace("_", " ").toUpperCase()}
            </p>
          </div>

          {blockedStagesCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {blockedStagesCount} stage{blockedStagesCount > 1 ? "s" : ""} blocked
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Progress value={mandatoryProgress} className="flex-1 h-3" />
            <span className="text-2xl font-bold text-slate-900 w-16 text-right">
              {mandatoryProgress}%
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {completedMandatory} of {totalMandatory} mandatory tasks complete
            </span>
            <span>
              {completedTasks} of {totalTasks} total tasks
            </span>
          </div>
        </div>
      </Card>

      {/* Stage Accordions */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <StageAccordion
            key={stage.id}
            stage={stage}
            isCurrentStage={stage.id === workflow.currentStageId}
            previousStageComplete={
              index === 0 ||
              stages[index - 1].status === "completed" ||
              stages[index - 1].status === "skipped"
            }
            onTaskUpdated={handleTaskUpdated}
          />
        ))}
      </div>
    </div>
  );
}
