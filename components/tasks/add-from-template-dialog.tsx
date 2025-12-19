"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/hooks/use-toast";
import { TemplatePreview } from "@/components/task-templates/template-preview";
import type { TaskTemplateWithItems } from "@/lib/api/schemas/task-templates";

interface AddFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matterId: string;
  practiceArea: string;
  subType: string | undefined;
  onTasksAdded?: () => void;
}

interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export function AddFromTemplateDialog({
  open,
  onOpenChange,
  matterId,
  practiceArea,
  subType,
  onTasksAdded,
}: AddFromTemplateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplateWithItems | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Fetch available templates
  const fetchTemplates = useCallback(async () => {
    if (!practiceArea || !subType) {
      setTemplates([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/task-templates?practiceArea=${encodeURIComponent(practiceArea)}&subType=${encodeURIComponent(subType)}&isActive=true`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await res.json();
      const templateList: TemplateListItem[] = (data.templates || []).map(
        (t: TaskTemplateWithItems) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          isDefault: t.isDefault,
        })
      );
      setTemplates(templateList);

      // Auto-select default or only template
      if (templateList.length === 1) {
        await loadTemplate(templateList[0].id);
      } else {
        const defaultTemplate = templateList.find((t) => t.isDefault);
        if (defaultTemplate) {
          await loadTemplate(defaultTemplate.id);
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [practiceArea, subType]);

  // Load full template details
  const loadTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/task-templates/${templateId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load template");
      }

      const template: TaskTemplateWithItems = await res.json();
      setSelectedTemplate(template);

      // Pre-select all mandatory items
      const mandatoryIds = template.items.filter((item) => item.mandatory).map((item) => item.id);
      setSelectedItemIds(mandatoryIds);
    } catch (error) {
      console.error("Error loading template:", error);
      toast({
        title: "Error",
        description: "Failed to load template details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection changes from TemplatePreview
  const handleSelectionChange = (ids: string[]) => {
    // Ensure mandatory items are always included
    const mandatoryIds =
      selectedTemplate?.items.filter((item) => item.mandatory).map((item) => item.id) ?? [];

    const newSelection = [...new Set([...mandatoryIds, ...ids])];
    setSelectedItemIds(newSelection);
  };

  // Apply template
  const handleApply = async () => {
    if (!selectedTemplate || selectedItemIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/matters/${matterId}/apply-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          selectedItemIds,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply template");
      }

      const result = await res.json();

      toast({
        title: "Tasks added",
        description: `${result.tasksCreated} task(s) added from template.`,
      });

      onTasksAdded?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setSelectedItemIds([]);
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  const hasNoTemplates = !isLoading && templates.length === 0;
  const taskCount = selectedItemIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Tasks from Template
          </DialogTitle>
          <DialogDescription>
            {practiceArea && subType
              ? "Select tasks from available templates for this case type."
              : "Set the case type to see available templates."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && !selectedTemplate ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3">
                    <Skeleton className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : hasNoTemplates ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No templates available for this case type.</p>
              <p className="text-xs mt-1">
                Templates are configured for specific practice areas and case types.
              </p>
            </div>
          ) : (
            <>
              {/* Template selector if multiple available */}
              {templates.length > 1 && (
                <div className="mb-4">
                  <label className="text-sm font-medium">Select Template</label>
                  <div className="mt-2 space-y-1">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => loadTemplate(t.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 ${
                          selectedTemplate?.id === t.id ? "bg-slate-100" : ""
                        }`}
                      >
                        <span className="font-medium">{t.name}</span>
                        {t.isDefault && (
                          <span className="ml-2 text-xs text-blue-600">(Default)</span>
                        )}
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Template preview */}
              {selectedTemplate && (
                <TemplatePreview
                  template={selectedTemplate}
                  selectedItemIds={selectedItemIds}
                  onSelectionChange={handleSelectionChange}
                  loading={isLoading}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSubmitting || !selectedTemplate || taskCount === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add {taskCount} Task{taskCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
