"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, Workflow } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkflowSummaryCardProps {
  matterId: string;
  onNavigateToWorkflow?: () => void;
}

interface WorkflowStage {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  gateType: "hard" | "soft" | "none";
  totalTasks: number;
  completedTasks: number;
  mandatoryTasks: number;
  completedMandatoryTasks: number;
  tasks: Array<{
    isBlocked: boolean;
  }>;
}

interface WorkflowData {
  workflow: {
    id: string;
    currentStageId: string | null;
    template: {
      name: string;
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

export function WorkflowSummaryCard({ matterId, onNavigateToWorkflow }: WorkflowSummaryCardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["matter-workflow", matterId],
    queryFn: () => fetchMatterWorkflow(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      </Card>
    );
  }

  if (isError || !data?.workflow) {
    return null; // No workflow activated - don't show the card
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

  // Find current stage
  const currentStage =
    stages.find((s) => s.id === workflow.currentStageId) ??
    stages.find((s) => s.status === "in_progress" || s.status === "pending");

  // Check for any blocked tasks
  const hasBlockedTasks = stages.some((s) => s.tasks.some((t) => t.isBlocked));

  // Check for hard gate blocking
  const hasHardGateBlock = stages.some(
    (s) =>
      s.gateType === "hard" &&
      s.status === "pending" &&
      stages.findIndex((st) => st.id === s.id) > 0
  );

  const isBlocked = hasBlockedTasks || hasHardGateBlock;

  return (
    <Card
      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 hover:border-slate-300 ${
        isBlocked ? "border-amber-200 bg-amber-50/30" : ""
      }`}
      onClick={onNavigateToWorkflow}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Workflow className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">Workflow Progress</h3>
            {isBlocked && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Progress value={mandatoryProgress} className="flex-1 h-2" />
              <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                {mandatoryProgress}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {completedMandatory}/{totalMandatory} mandatory
                {totalTasks > totalMandatory && ` \u00B7 ${completedTasks}/${totalTasks} total`}
              </span>
              {currentStage && (
                <span className="font-medium text-slate-700">Current: {currentStage.name}</span>
              )}
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400 ml-3 flex-shrink-0" />
      </div>
    </Card>
  );
}
