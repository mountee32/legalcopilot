"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  Filter,
  Search,
  Clock,
  Users,
  Briefcase,
  ChevronRight,
  Shield,
  FileCheck,
  User,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPracticeArea, getPracticeAreaColor } from "@/lib/constants/practice-areas";

interface ComplianceTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  daysOverdue: number | null;
  isMandatory: boolean;
  requiresEvidence: boolean;
  requiresApproval: boolean;
  matter: {
    id: string;
    reference: string;
    title: string;
    practiceArea: string;
    status: string;
  };
  client: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ComplianceStats {
  totalOverdue: number;
  overdueByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  avgDaysOverdue: number;
}

interface PracticeAreaCount {
  practiceArea: string;
  count: number;
}

interface AssigneeCount {
  assigneeId: string | null;
  assigneeName: string | null;
  count: number;
}

interface ComplianceResponse {
  tasks: ComplianceTask[];
  stats: ComplianceStats;
  byPracticeArea: PracticeAreaCount[];
  byAssignee: AssigneeCount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

async function fetchComplianceTasks(
  practiceArea?: string,
  assigneeId?: string,
  page = 1
): Promise<ComplianceResponse> {
  const params = new URLSearchParams();
  if (practiceArea) params.set("practiceArea", practiceArea);
  if (assigneeId) params.set("assigneeId", assigneeId);
  params.set("page", page.toString());
  params.set("limit", "20");

  const res = await fetch(`/api/compliance/tasks?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch compliance data");
  return res.json();
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: "bg-red-100 border-red-200 text-red-700",
    high: "bg-orange-100 border-orange-200 text-orange-700",
    medium: "bg-amber-100 border-amber-200 text-amber-700",
    low: "bg-slate-100 border-slate-200 text-slate-600",
  };
  return colors[priority] || colors.medium;
}

export default function ComplianceDashboardPage() {
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string | undefined>();
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-tasks", selectedPracticeArea, selectedAssignee, page],
    queryFn: () => fetchComplianceTasks(selectedPracticeArea, selectedAssignee, page),
    staleTime: 30_000,
  });

  const tasks = data?.tasks || [];
  const stats = data?.stats;
  const byPracticeArea = data?.byPracticeArea || [];
  const byAssignee = data?.byAssignee || [];
  const pagination = data?.pagination;

  // Client-side search filter
  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.matter.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.matter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Compliance Dashboard
              </h1>
              <p className="text-sm text-slate-500">Overdue mandatory tasks across all matters</p>
            </div>
          </div>
          <div className="border-b border-slate-200 mt-4" />
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm p-4">
                <Skeleton className="h-16 w-full bg-slate-100" />
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalOverdue}</div>
                  <div className="text-xs text-slate-500">Total Overdue</div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.avgDaysOverdue}</div>
                  <div className="text-xs text-slate-500">Avg Days Overdue</div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.overdueByPriority.urgent + stats.overdueByPriority.high}
                  </div>
                  <div className="text-xs text-slate-500">Urgent + High Priority</div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getPriorityColor("urgent")}>
                  {stats.overdueByPriority.urgent} Urgent
                </Badge>
                <Badge variant="outline" className={getPriorityColor("high")}>
                  {stats.overdueByPriority.high} High
                </Badge>
                <Badge variant="outline" className={getPriorityColor("medium")}>
                  {stats.overdueByPriority.medium} Med
                </Badge>
                <Badge variant="outline" className={getPriorityColor("low")}>
                  {stats.overdueByPriority.low} Low
                </Badge>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tasks, matters, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Practice Area Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400" />
            <button
              onClick={() => {
                setSelectedPracticeArea(undefined);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                !selectedPracticeArea
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Areas
            </button>
            {byPracticeArea.slice(0, 5).map((area) => (
              <button
                key={area.practiceArea}
                onClick={() => {
                  setSelectedPracticeArea(area.practiceArea);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedPracticeArea === area.practiceArea
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {formatPracticeArea(area.practiceArea)} ({area.count})
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Task List */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="bg-white border-slate-200 shadow-sm p-4">
                    <Skeleton className="h-20 w-full bg-slate-100" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="bg-red-50 border-red-200 p-8 text-center">
                <p className="text-red-600">Failed to load compliance data. Please try again.</p>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card className="bg-white border-slate-200 shadow-sm p-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">All Clear</h3>
                <p className="text-sm text-slate-500">
                  {searchQuery ? "No tasks match your search" : "No overdue mandatory tasks found"}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Days overdue indicator */}
                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-red-100 rounded-lg text-red-700">
                          <span className="text-lg font-bold">{task.daysOverdue || 0}</span>
                          <span className="text-[10px] uppercase">days</span>
                        </div>

                        {/* Task details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <h3 className="font-medium text-slate-900">{task.title}</h3>
                              <Link
                                href={`/matters/${task.matter.id}`}
                                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                              >
                                <Briefcase className="h-3 w-3" />
                                {task.matter.reference} - {task.matter.title}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getPracticeAreaColor(task.matter.practiceArea)}
                              >
                                {formatPracticeArea(task.matter.practiceArea)}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            {task.client && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {task.client.name}
                              </span>
                            )}
                            {task.assignee ? (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {task.assignee.name}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <User className="h-3.5 w-3.5" />
                                Unassigned
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-red-600">
                                <Clock className="h-3.5 w-3.5" />
                                Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>

                          {/* Requirements */}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="bg-red-100 border-red-200 text-red-700 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Mandatory
                            </Badge>
                            {task.requiresEvidence && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 border-blue-200 text-blue-700 text-xs"
                              >
                                <FileCheck className="h-3 w-3 mr-1" />
                                Evidence Required
                              </Badge>
                            )}
                            {task.requiresApproval && (
                              <Badge
                                variant="outline"
                                className="bg-purple-100 border-purple-200 text-purple-700 text-xs"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Approval Required
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        <Link
                          href={`/matters/${task.matter.id}?task=${task.id}`}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} tasks)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* By Assignee */}
            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                By Assignee
              </h3>
              <div className="space-y-2">
                {byAssignee.length === 0 ? (
                  <p className="text-sm text-slate-500">No data</p>
                ) : (
                  byAssignee.slice(0, 8).map((a, i) => (
                    <button
                      key={a.assigneeId || `unassigned-${i}`}
                      onClick={() => {
                        setSelectedAssignee(
                          selectedAssignee === a.assigneeId ? undefined : a.assigneeId || undefined
                        );
                        setPage(1);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                        selectedAssignee === a.assigneeId
                          ? "bg-slate-100 text-slate-900"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="truncate">{a.assigneeName || "Unassigned"}</span>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        {a.count}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* By Practice Area */}
            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                By Practice Area
              </h3>
              <div className="space-y-2">
                {byPracticeArea.length === 0 ? (
                  <p className="text-sm text-slate-500">No data</p>
                ) : (
                  byPracticeArea.map((area) => (
                    <button
                      key={area.practiceArea}
                      onClick={() => {
                        setSelectedPracticeArea(
                          selectedPracticeArea === area.practiceArea ? undefined : area.practiceArea
                        );
                        setPage(1);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                        selectedPracticeArea === area.practiceArea
                          ? "bg-slate-100 text-slate-900"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="truncate">{formatPracticeArea(area.practiceArea)}</span>
                      <Badge variant="outline" className={getPracticeAreaColor(area.practiceArea)}>
                        {area.count}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
