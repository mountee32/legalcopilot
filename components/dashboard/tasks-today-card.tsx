"use client";

import Link from "next/link";
import { CheckSquare, Square, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface TaskItem {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  matterId?: string;
  isOverdue?: boolean;
  isCompleted?: boolean;
}

interface TasksTodayCardProps {
  tasks: TaskItem[];
  total: number;
  isLoading?: boolean;
  onComplete?: (id: string) => void;
}

const priorityVariantMap: Record<string, "outline" | "secondary" | "warning" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "warning",
  urgent: "destructive",
};

export function TasksTodayCard({ tasks, total, isLoading, onComplete }: TasksTodayCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="tasks-today-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-14" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="tasks-today-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CheckSquare className="h-4 w-4 text-primary" />
          My Tasks Today
          {total > 0 && (
            <Badge variant="secondary" className="ml-1">
              {total}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="tasks-today-empty">
            All caught up! No tasks for today.
          </p>
        ) : (
          <ul className="space-y-2" data-testid="tasks-today-list">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={cn("flex items-start gap-3 group", task.isCompleted && "opacity-50")}
                data-testid={`task-item-${task.id}`}
              >
                <button
                  onClick={() => onComplete?.(task.id)}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary"
                  data-testid={`task-checkbox-${task.id}`}
                  aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
                >
                  {task.isCompleted ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-tight", task.isCompleted && "line-through")}>
                    {task.title}
                  </p>
                  {task.matterId && (
                    <p className="text-xs text-muted-foreground">{task.matterId}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.isOverdue && (
                    <AlertCircle
                      className="h-4 w-4 text-destructive"
                      data-testid={`task-overdue-${task.id}`}
                    />
                  )}
                  <Badge
                    variant={priorityVariantMap[task.priority]}
                    className="text-xs"
                    data-testid={`task-priority-${task.id}`}
                  >
                    {task.priority}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {tasks.length > 0 && (
        <CardFooter className="pt-0">
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link href="/tasks" data-testid="view-all-tasks-link">
              View All Tasks
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
