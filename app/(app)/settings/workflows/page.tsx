"use client";

import { useQuery } from "@tanstack/react-query";
import { GitBranch, Filter, Search } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { PRACTICE_AREA_OPTIONS } from "@/lib/constants/practice-areas";

interface WorkflowTemplate {
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
  createdAt: string;
}

interface WorkflowListResponse {
  workflows: WorkflowTemplate[];
  total: number;
}

async function fetchWorkflows(practiceArea?: string): Promise<WorkflowListResponse> {
  const params = new URLSearchParams();
  if (practiceArea) params.set("practiceArea", practiceArea);

  const res = await fetch(`/api/workflows?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

const PRACTICE_AREAS = [
  { value: "all", label: "All Areas" },
  ...PRACTICE_AREA_OPTIONS.filter((area) => area.value !== "other"),
];

export default function WorkflowsSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPracticeArea, setSelectedPracticeArea] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflows", selectedPracticeArea === "all" ? undefined : selectedPracticeArea],
    queryFn: () =>
      fetchWorkflows(selectedPracticeArea === "all" ? undefined : selectedPracticeArea),
    staleTime: 60_000,
  });

  const workflows = data?.workflows || [];

  // Filter by search query
  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workflow Templates</h1>
            <span className="text-sm font-mono text-slate-500 tracking-wider uppercase">
              System Defined
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            View and explore the workflow templates available for your matters. These templates
            define the stages and tasks that guide case progression.
          </p>
          <div className="border-b border-slate-200 mt-4" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Practice Area Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400" />
            {PRACTICE_AREAS.map((area) => (
              <button
                key={area.value}
                onClick={() => setSelectedPracticeArea(area.value)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedPracticeArea === area.value
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {area.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-slate-100" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2 bg-slate-100" />
                    <Skeleton className="h-3 w-32 bg-slate-100" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-4 bg-slate-100" />
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <Skeleton className="h-4 w-20 bg-slate-100" />
                  <Skeleton className="h-4 w-20 bg-slate-100" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200 p-8 text-center">
            <p className="text-red-600">Failed to load workflows. Please try again.</p>
          </Card>
        ) : filteredWorkflows.length === 0 ? (
          <Card className="bg-white border-slate-200 shadow-sm p-12 text-center">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No workflows found</h3>
            <p className="text-sm text-slate-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "No workflow templates are available for this practice area"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && filteredWorkflows.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <span>
              {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? "s" : ""}
            </span>
            {searchQuery && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
