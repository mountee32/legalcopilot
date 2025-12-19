"use client";

import { format } from "date-fns";
import { CheckSquare, Clock, MoreHorizontal, Pencil, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate: string | null;
  assigneeId: string | null;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onCancel: (taskId: string) => void;
  isUpdating?: boolean;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-slate-100 text-slate-700",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") {
    return <CheckSquare className="w-5 h-5 text-green-600" />;
  }
  if (status === "in_progress") {
    return <Clock className="w-5 h-5 text-blue-600" />;
  }
  if (status === "cancelled") {
    return <X className="w-5 h-5 text-slate-400" />;
  }
  return <CheckSquare className="w-5 h-5 text-slate-400" />;
}

export function TaskCard({
  task,
  onEdit,
  onComplete,
  onCancel,
  isUpdating = false,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isActionable = !isCompleted && !isCancelled;

  return (
    <Card
      className={`p-4 transition-colors ${
        isCancelled ? "opacity-60 bg-slate-50" : "hover:bg-slate-50 cursor-pointer"
      }`}
      onClick={() => !isCancelled && onEdit(task)}
      role="button"
      tabIndex={isCancelled ? -1 : 0}
      aria-label={`Edit task: ${task.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isCancelled) {
          onEdit(task);
        }
      }}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5">
          <StatusIcon status={task.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p
              className={`font-medium ${
                isCompleted || isCancelled ? "text-slate-500 line-through" : "text-slate-900"
              }`}
            >
              {task.title}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                priorityColors[task.priority] || priorityColors.medium
              }`}
            >
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
          )}
          {task.dueDate && (
            <p className="text-xs text-slate-500 mt-2">
              Due: {format(new Date(task.dueDate), "d MMM yyyy")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isActionable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isUpdating}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Task actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onComplete(task.id)} className="text-green-600">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCancel(task.id)} className="text-red-600">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Badge
            variant={
              isCompleted
                ? "secondary"
                : isCancelled
                  ? "outline"
                  : task.status === "in_progress"
                    ? "default"
                    : "outline"
            }
          >
            {task.status.replace("_", " ")}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
