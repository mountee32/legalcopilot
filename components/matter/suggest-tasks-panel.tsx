"use client";

import { useState } from "react";
import { Brain, Check, Loader2, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";

interface SuggestedTask {
  title: string;
  description?: string;
  priority?: string;
  dueInDays?: number;
  rationale?: string;
}

interface SuggestTasksPanelProps {
  matterId: string;
  onCreated: () => void;
}

const priorityColor: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-700",
};

export function SuggestTasksPanel({ matterId, onCreated }: SuggestTasksPanelProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const handleSuggest = async () => {
    setIsFetching(true);
    setSuggestions([]);
    setCreated(false);
    try {
      const res = await fetch(`/api/matters/${matterId}/ai/suggest-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const json = await res.json();
      const items = json.suggestions ?? [];
      setSuggestions(items);
      setSelected(new Set(items.map((_: unknown, i: number) => i)));
    } catch {
      toast({
        title: "Error",
        description: "Could not load AI task suggestions",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const toggleTask = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCreate = async () => {
    const tasksToCreate = suggestions
      .filter((_, i) => selected.has(i))
      .map(({ title, description, priority, dueInDays }) => ({
        title,
        description,
        priority,
        dueInDays,
      }));

    if (tasksToCreate.length === 0) {
      toast({ title: "No tasks selected", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/matters/${matterId}/ai/create-suggested-tasks`, {
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
      onCreated();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create tasks",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (created) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 mb-4">
        <div className="p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            Tasks created from AI suggestions
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCreated(false);
              setSuggestions([]);
            }}
          >
            Suggest more
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 p-4 space-y-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-slate-700">AI Task Suggestions</h4>
        </div>
        <Button size="sm" variant="outline" onClick={handleSuggest} disabled={isFetching}>
          {isFetching ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Analysing...
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="space-y-2">
            {suggestions.map((task, idx) => (
              <label
                key={idx}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(idx)}
                  onChange={() => toggleTask(idx)}
                  className="mt-1 rounded border-slate-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{task.title}</span>
                    {task.priority && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityColor[task.priority] ?? priorityColor.medium}`}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.dueInDays !== undefined && (
                      <span className="text-xs text-slate-500">Due in {task.dueInDays}d</span>
                    )}
                  </div>
                  {task.rationale && (
                    <p className="text-xs text-slate-500 mt-0.5">{task.rationale}</p>
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
        </>
      )}
    </Card>
  );
}
