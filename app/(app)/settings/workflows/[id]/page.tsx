"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  GitBranch,
  ArrowLeft,
  Layers,
  CheckSquare,
  AlertTriangle,
  FileCheck,
  Shield,
  Lock,
  Unlock,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowStageView } from "@/components/workflows/workflow-stage-view";

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

interface WorkflowDetail {
  id: string;
  key: string;
  name: string;
  description: string | null;
  practiceArea: string;
  subTypes: string[] | null;
  version: string;
  isActive: boolean;
  createdAt: string;
  stages: Stage[];
}

async function fetchWorkflow(id: string): Promise<{ workflow: WorkflowDetail }> {
  const res = await fetch(`/api/workflows/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch workflow");
  return res.json();
}

function getPracticeAreaColor(practiceArea: string): string {
  const colors: Record<string, string> = {
    conveyancing: "bg-blue-100 border-blue-200 text-blue-700",
    litigation: "bg-red-100 border-red-200 text-red-700",
    family: "bg-pink-100 border-pink-200 text-pink-700",
    corporate: "bg-purple-100 border-purple-200 text-purple-700",
    probate: "bg-amber-100 border-amber-200 text-amber-700",
    employment: "bg-green-100 border-green-200 text-green-700",
    immigration: "bg-teal-100 border-teal-200 text-teal-700",
    commercial: "bg-indigo-100 border-indigo-200 text-indigo-700",
  };
  return colors[practiceArea] || "bg-slate-100 border-slate-200 text-slate-700";
}

function formatPracticeArea(practiceArea: string): string {
  return practiceArea
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(workflowId),
    staleTime: 60_000,
    enabled: !!workflowId,
  });

  const workflow = data?.workflow;

  // Calculate stats
  const totalTasks = workflow?.stages.reduce((sum, stage) => sum + stage.tasks.length, 0) || 0;
  const mandatoryTasks =
    workflow?.stages.reduce(
      (sum, stage) => sum + stage.tasks.filter((t) => t.isMandatory).length,
      0
    ) || 0;
  const evidenceTasks =
    workflow?.stages.reduce(
      (sum, stage) => sum + stage.tasks.filter((t) => t.requiresEvidence).length,
      0
    ) || 0;
  const approvalTasks =
    workflow?.stages.reduce(
      (sum, stage) => sum + stage.tasks.filter((t) => t.requiresApproval).length,
      0
    ) || 0;
  const hardGates = workflow?.stages.filter((s) => s.gateType === "hard").length || 0;
  const softGates = workflow?.stages.filter((s) => s.gateType === "soft").length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          href="/settings/workflows"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workflows
        </Link>

        {isLoading ? (
          <div>
            <div className="flex items-start gap-4 mb-8">
              <Skeleton className="h-14 w-14 rounded-lg bg-slate-100" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2 bg-slate-100" />
                <Skeleton className="h-4 w-48 bg-slate-100" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white border-slate-200 shadow-sm p-4">
                  <Skeleton className="h-16 w-full bg-slate-100" />
                </Card>
              ))}
            </div>
          </div>
        ) : error || !workflow ? (
          <Card className="bg-red-50 border-red-200 p-8 text-center">
            <p className="text-red-600">Failed to load workflow. Please try again.</p>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-slate-100 rounded-lg">
                <GitBranch className="h-8 w-8 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {workflow.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPracticeAreaColor(workflow.practiceArea)}`}
                  >
                    {formatPracticeArea(workflow.practiceArea)}
                  </Badge>
                  {!workflow.isActive && (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 border-slate-200 text-slate-500 text-xs"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="font-mono">{workflow.key}</span>
                  <span className="text-slate-300">|</span>
                  <span>v{workflow.version}</span>
                  <span className="text-slate-300">|</span>
                  <span>Created {format(parseISO(workflow.createdAt), "MMM d, yyyy")}</span>
                </div>
                {workflow.description && (
                  <p className="text-sm text-slate-600 mt-3">{workflow.description}</p>
                )}

                {/* Sub-types */}
                {workflow.subTypes && workflow.subTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {workflow.subTypes.map((subType) => (
                      <Badge
                        key={subType}
                        variant="outline"
                        className="bg-slate-50 border-slate-200 text-slate-600 text-xs"
                      >
                        {subType.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-slate-200 mb-8" />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
              <Card className="bg-white border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Layers className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-slate-900">
                      {workflow.stages.length}
                    </div>
                    <div className="text-xs text-slate-500">Stages</div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-slate-900">{totalTasks}</div>
                    <div className="text-xs text-slate-500">Total Tasks</div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-slate-900">{mandatoryTasks}</div>
                    <div className="text-xs text-slate-500">Mandatory</div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-slate-900">{evidenceTasks}</div>
                    <div className="text-xs text-slate-500">Need Evidence</div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-slate-900">{approvalTasks}</div>
                    <div className="text-xs text-slate-500">Need Approval</div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-slate-900">
                      {hardGates}/{softGates}
                    </div>
                    <div className="text-xs text-slate-500">Hard/Soft Gates</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Gate Legend */}
            <Card className="bg-white border-slate-200 shadow-sm p-4 mb-8">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Gate Types</h4>
                  <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-red-600" />
                      <span>
                        <strong className="text-red-700">Hard Gate</strong> - Cannot proceed until
                        all mandatory tasks complete
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-amber-600" />
                      <span>
                        <strong className="text-amber-700">Soft Gate</strong> - Warning shown but
                        can proceed with supervisor override
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stages */}
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Workflow Stages</h2>
            <WorkflowStageView stages={workflow.stages} defaultExpanded={false} />
          </>
        )}
      </div>
    </div>
  );
}
