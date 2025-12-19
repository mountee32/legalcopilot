"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplatePreview } from "./template-preview";
import type { TaskTemplateWithItems } from "@/lib/api/schemas/task-templates";

interface TemplateSelectorProps {
  practiceArea: string;
  subType: string | undefined;
  onTemplateChange: (selection: TemplateSelection | null) => void;
}

export interface TemplateSelection {
  templateId: string;
  selectedItemIds: string[];
}

interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  itemCount: number;
}

export function TemplateSelector({
  practiceArea,
  subType,
  onTemplateChange,
}: TemplateSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplateWithItems | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showTemplateList, setShowTemplateList] = useState(false);

  // Load full template details
  const loadTemplate = useCallback(
    async (templateId: string) => {
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

        // Pre-select all mandatory items and optionally selected items
        const mandatoryIds = template.items.filter((item) => item.mandatory).map((item) => item.id);
        setSelectedItemIds(mandatoryIds);
        onTemplateChange({ templateId: template.id, selectedItemIds: mandatoryIds });
      } catch (error) {
        console.error("Error loading template:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onTemplateChange]
  );

  // Fetch templates when practice area and sub-type are both set
  const fetchTemplates = useCallback(async () => {
    if (!practiceArea || !subType) {
      setTemplates([]);
      setSelectedTemplate(null);
      setSelectedItemIds([]);
      onTemplateChange(null);
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
          itemCount: 0, // Will be populated when template is loaded
        })
      );
      setTemplates(templateList);

      // Auto-select default template if one exists
      const defaultTemplate = templateList.find((t) => t.isDefault);
      if (defaultTemplate) {
        await loadTemplate(defaultTemplate.id);
        setIsExpanded(true);
      } else if (templateList.length === 1) {
        // Auto-select if only one template
        await loadTemplate(templateList[0].id);
        setIsExpanded(true);
      } else {
        setSelectedTemplate(null);
        setSelectedItemIds([]);
        onTemplateChange(null);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [practiceArea, subType, onTemplateChange, loadTemplate]);

  // Handle selection changes
  const handleSelectionChange = (ids: string[]) => {
    // Ensure mandatory items are always included
    const mandatoryIds =
      selectedTemplate?.items.filter((item) => item.mandatory).map((item) => item.id) ?? [];

    const newSelection = [
      ...new Set([
        ...mandatoryIds,
        ...ids.filter((id) => !mandatoryIds.includes(id) || ids.includes(id)),
      ]),
    ];

    setSelectedItemIds(newSelection);

    if (selectedTemplate) {
      onTemplateChange({ templateId: selectedTemplate.id, selectedItemIds: newSelection });
    }
  };

  // Handle switching templates
  const handleSwitchTemplate = async (templateId: string) => {
    setShowTemplateList(false);
    await loadTemplate(templateId);
  };

  // Fetch templates when practice area or sub-type changes
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Don't show anything if no practice area/sub-type selected
  if (!practiceArea || !subType) {
    return null;
  }

  // Show loading state
  if (isLoading && !selectedTemplate) {
    return (
      <Card className="mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Loading templates...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Show message if no templates available
  if (templates.length === 0 && !isLoading) {
    return (
      <Card className="mt-4 border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            No task templates available for this case type
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Task Template
            {selectedTemplate && (
              <span className="font-normal text-muted-foreground">
                ({selectedTemplate.items.length} tasks)
              </span>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Template Switcher */}
          {templates.length > 1 && (
            <div className="mb-4">
              {showTemplateList ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select a template:</p>
                  <div className="space-y-1">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSwitchTemplate(t.id)}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplateList(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowTemplateList(true)}
                >
                  Use a different template
                </Button>
              )}
            </div>
          )}

          {/* Template Preview */}
          {!showTemplateList && (
            <TemplatePreview
              template={selectedTemplate}
              selectedItemIds={selectedItemIds}
              onSelectionChange={handleSelectionChange}
              loading={isLoading}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
