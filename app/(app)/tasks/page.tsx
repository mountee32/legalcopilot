"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/hooks/use-toast";
import { format, isBefore, isToday, startOfDay } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  matterId: string;
  assigneeId?: string;
  aiGenerated: boolean;
}

interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchTasks(params: {
  page: number;
  search?: string;
  status?: string;
  priority?: string;
}): Promise<TaskListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", params.page.toString());
  searchParams.set("limit", "20");
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);

  const res = await fetch(`/api/tasks?${searchParams}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    urgent: { color: "bg-red-100 text-red-700 border-red-200", label: "Urgent" },
    high: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "High" },
    medium: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Medium" },
    low: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Low" },
  };

  const { color, label } = config[priority as keyof typeof config] || config.medium;

  return (
    <Badge variant="outline" className={`text-xs ${color} border`}>
      {label}
    </Badge>
  );
}

function TaskCard({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const router = useRouter();
  const isCompleted = task.status === "completed";
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date()));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card className={`p-4 transition-all ${isCompleted ? "opacity-60" : "hover:shadow-sm"}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isCompleted) onComplete(task.id);
          }}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? "bg-emerald-500 border-emerald-500"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
        </button>

        <div
          className="flex-1 cursor-pointer"
          onClick={() => router.push(`/matters/${task.matterId}`)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3
                className={`font-medium text-slate-900 mb-1 ${isCompleted ? "line-through" : ""}`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <PriorityBadge priority={task.priority} />
            {task.aiGenerated && (
              <Badge variant="secondary" className="text-xs">
                AI Generated
              </Badge>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-xs">
                {isOverdue ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-medium">
                      Overdue {format(new Date(task.dueDate), "d MMM")}
                    </span>
                  </>
                ) : isDueToday ? (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-600 font-medium">Due Today</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500">
                      Due {format(new Date(task.dueDate), "d MMM")}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks", page, search, statusFilter, priorityFilter],
    queryFn: () =>
      fetchTasks({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
    staleTime: 30_000,
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Task completed", description: "Task marked as complete" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tasks</h1>
              <p className="text-slate-600 mt-1">Manage your tasks and to-dos</p>
            </div>
            <Button onClick={() => router.push("/tasks/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8">
            <EmptyState
              title="Failed to load tasks"
              description="There was an error loading the task list. Please try again."
            />
          </Card>
        ) : data && data.tasks.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="No tasks found"
              description={
                search || statusFilter || priorityFilter
                  ? "Try adjusting your filters"
                  : "Tasks will appear here when created manually or generated by AI"
              }
            />
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {data?.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onComplete={(id) => completeTask.mutate(id)} />
              ))}
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-600">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.pagination.total)} of{" "}
                  {data.pagination.total} tasks
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
