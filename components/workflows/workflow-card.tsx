"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Layers, CheckSquare, Calendar } from "lucide-react";

interface WorkflowCardProps {
  workflow: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    practiceArea: string;
    subTypes: string[] | null;
    version: string;
    isActive: boolean;
    stageCount: number;
    taskCount: number;
  };
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

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <Link href={`/settings/workflows/${workflow.id}`}>
      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                <GitBranch className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-slate-700 transition-colors">
                  {workflow.name}
                </h3>
                <p className="text-xs font-mono text-slate-500">{workflow.key}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          {/* Description */}
          {workflow.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{workflow.description}</p>
          )}

          {/* Sub-types */}
          {workflow.subTypes && workflow.subTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
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

          {/* Stats */}
          <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Layers className="h-4 w-4 text-slate-400" />
              <span>{workflow.stageCount} stages</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckSquare className="h-4 w-4 text-slate-400" />
              <span>{workflow.taskCount} tasks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>v{workflow.version}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
