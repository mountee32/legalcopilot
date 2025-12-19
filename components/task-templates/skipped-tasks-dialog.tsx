"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/hooks/use-toast";
import { formatSubType } from "@/lib/constants/practice-sub-types";
import type { TemplateStatusResponse, TaskTemplateItem } from "@/lib/api/schemas/task-templates";

interface SkippedTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matterId: string;
  onTasksAdded?: () => void;
}

const categoryColors: Record<string, string> = {
  regulatory: "bg-red-100 text-red-700",
  legal: "bg-orange-100 text-orange-700",
  firm_policy: "bg-blue-100 text-blue-700",
  best_practice: "bg-green-100 text-green-700",
};

const categoryLabels: Record<string, string> = {
  regulatory: "Regulatory",
  legal: "Legal",
  firm_policy: "Firm Policy",
  best_practice: "Best Practice",
};

export function SkippedTasksDialog({
  open,
  onOpenChange,
  matterId,
  onTasksAdded,
}: SkippedTasksDialogProps) {
  const [status, setStatus] = useState<TemplateStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/matters/${matterId}/template-status`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch template status");
        }

        const data = await res.json();
        setStatus(data);
        setSelectedItems(new Set());
        setAddedItems(new Set());
      } catch (error) {
        console.error("Error fetching template status:", error);
        toast({
          title: "Error",
          description: "Failed to load template information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [open, matterId]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds =
      status?.skippedItems.filter((item) => !addedItems.has(item.id)).map((item) => item.id) ?? [];
    setSelectedItems(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleAddSelected = async () => {
    if (selectedItems.size === 0 || !status?.applications[0]) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/matters/${matterId}/apply-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: status.applications[0].templateId,
          selectedItemIds: Array.from(selectedItems),
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to add tasks");
      }

      const result = await res.json();
      setAddedItems((prev) => new Set([...prev, ...selectedItems]));
      setSelectedItems(new Set());

      toast({
        title: "Tasks added",
        description: `${result.tasksCreated} task(s) added to the matter.`,
      });

      onTasksAdded?.();

      // Close dialog if all items have been added
      const remainingItems = status.skippedItems.filter(
        (item) => !addedItems.has(item.id) && !selectedItems.has(item.id)
      );
      if (remainingItems.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add tasks",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSingle = async (item: TaskTemplateItem) => {
    if (!status?.applications[0]) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/matters/${matterId}/apply-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: status.applications[0].templateId,
          selectedItemIds: [item.id],
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to add task");
      }

      setAddedItems((prev) => new Set([...prev, item.id]));
      selectedItems.delete(item.id);
      setSelectedItems(new Set(selectedItems));

      toast({
        title: "Task added",
        description: `"${item.title}" has been added to the matter.`,
      });

      onTasksAdded?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableItems = status?.skippedItems.filter((item) => !addedItems.has(item.id)) ?? [];
  const hasSelection = selectedItems.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Tasks from Template
          </DialogTitle>
          <DialogDescription>
            {status?.applications[0]
              ? `Tasks from "${status.applications[0].templateName}" that were not initially added.`
              : "Select tasks to add to this matter."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : availableItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All template tasks have been added!</p>
            </div>
          ) : (
            <>
              {/* Select All / Deselect All */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} of {availableItems.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-700"
                    disabled={isSubmitting}
                  >
                    Select all
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs text-blue-600 hover:text-blue-700"
                    disabled={isSubmitting}
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 border rounded-md transition-colors ${
                      selectedItems.has(item.id)
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      disabled={isSubmitting}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${categoryColors[item.category] ?? ""}`}
                        >
                          {categoryLabels[item.category] ?? item.category}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.relativeDueDays && item.dueDateAnchor && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {item.relativeDueDays} days from{" "}
                          {formatSubType(item.dueDateAnchor ?? "")}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddSingle(item)}
                      disabled={isSubmitting || selectedItems.has(item.id)}
                      className="h-8 shrink-0"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          {hasSelection && (
            <Button onClick={handleAddSelected} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected ({selectedItems.size})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
