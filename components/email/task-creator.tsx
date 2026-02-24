"use client";

import { useState } from "react";
import { Check, ListTodo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";

interface SuggestedTask {
  title: string;
  description?: string;
  priority?: string;
  dueInDays?: number;
}

interface TaskCreatorProps {
  emailId: string;
  suggestedTasks: SuggestedTask[];
  matterId: string | null;
  onTasksCreated: () => void;
}

export function TaskCreator({
  emailId,
  suggestedTasks,
  matterId,
  onTasksCreated,
}: TaskCreatorProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<number>>(new Set(suggestedTasks.map((_, i) => i)));
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  if (!matterId || suggestedTasks.length === 0) return null;

  const toggleTask = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCreate = async () => {
    const tasksToCreate = suggestedTasks
      .filter((_, i) => selected.has(i))
      .map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueInDays: t.dueInDays,
      }));

    if (tasksToCreate.length === 0) {
      toast({ title: "No tasks selected", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/create-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tasks: tasksToCreate }),
      });

      if (!res.ok) throw new Error("Failed to create tasks");

      setCreated(true);
      toast({
        title: "Tasks created",
        description: `${tasksToCreate.length} task(s) added to the matter`,
      });
      onTasksCreated();
    } catch {
      toast({ title: "Error", description: "Failed to create tasks", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  if (created) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <div className="p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Tasks created successfully</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-slate-700">Suggested Tasks</h4>
        </div>

        <div className="space-y-2 mb-4">
          {suggestedTasks.map((task, idx) => (
            <label
              key={idx}
              className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(idx)}
                onChange={() => toggleTask(idx)}
                className="mt-0.5 rounded border-slate-300"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800">{task.title}</span>
                {task.dueInDays !== undefined && (
                  <span className="text-xs text-slate-500 ml-2">
                    Due in {task.dueInDays} day{task.dueInDays !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>

        <Button
          onClick={handleCreate}
          disabled={selected.size === 0 || isCreating}
          size="sm"
          className="w-full gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <ListTodo className="h-4 w-4" />
              Create {selected.size} Task{selected.size !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
