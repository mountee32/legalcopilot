"use client";

import { Lock, CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSubType } from "@/lib/constants/practice-sub-types";
import type { TaskTemplateWithItems, TaskTemplateItem } from "@/lib/api/schemas/task-templates";

interface TemplatePreviewProps {
  template: TaskTemplateWithItems | null;
  selectedItemIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

const categoryColors: Record<string, string> = {
  regulatory: "bg-red-100 text-red-700 border-red-200",
  legal: "bg-orange-100 text-orange-700 border-orange-200",
  firm_policy: "bg-blue-100 text-blue-700 border-blue-200",
  best_practice: "bg-green-100 text-green-700 border-green-200",
};

const categoryLabels: Record<string, string> = {
  regulatory: "Regulatory",
  legal: "Legal",
  firm_policy: "Firm Policy",
  best_practice: "Best Practice",
};

function CategoryBadge({ category }: { category: string }) {
  const isSystemCategory = category === "regulatory" || category === "legal";
  return (
    <Badge
      variant="outline"
      className={`text-xs ${categoryColors[category] ?? "bg-slate-100 text-slate-700"}`}
    >
      {isSystemCategory && <Lock className="h-3 w-3 mr-1" />}
      {categoryLabels[category] ?? category}
    </Badge>
  );
}

function TaskItemRow({
  item,
  isSelected,
  onToggle,
  disabled,
}: {
  item: TaskTemplateItem;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-slate-50">
      <div className="pt-0.5">
        {disabled ? (
          <CheckSquare className="h-4 w-4 text-slate-400" />
        ) : (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={`Select ${item.title}`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${disabled ? "text-slate-500" : ""}`}>
            {item.title}
          </span>
          <CategoryBadge category={item.category} />
          {item.defaultPriority && item.defaultPriority !== "medium" && (
            <Badge variant="outline" className="text-xs capitalize">
              {item.defaultPriority}
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
        )}
        {item.relativeDueDays && item.dueDateAnchor && (
          <p className="text-xs text-muted-foreground mt-1">
            Due: {item.relativeDueDays} days from {formatSubType(item.dueDateAnchor)}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
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
  );
}

export function TemplatePreview({
  template,
  selectedItemIds,
  onSelectionChange,
  loading = false,
}: TemplatePreviewProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!template) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No template available for this case type</p>
      </div>
    );
  }

  const mandatoryItems = template.items.filter((item) => item.mandatory);
  const optionalItems = template.items.filter((item) => !item.mandatory);

  const handleToggle = (itemId: string) => {
    if (selectedItemIds.includes(itemId)) {
      onSelectionChange(selectedItemIds.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItemIds, itemId]);
    }
  };

  const selectAllOptional = () => {
    const allOptionalIds = optionalItems.map((item) => item.id);
    const mandatoryIds = mandatoryItems.map((item) => item.id);
    onSelectionChange([...mandatoryIds, ...allOptionalIds]);
  };

  const deselectAllOptional = () => {
    const mandatoryIds = mandatoryItems.map((item) => item.id);
    onSelectionChange(mandatoryIds);
  };

  return (
    <div className="space-y-4">
      {/* Template Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{template.name}</h4>
        <span className="text-xs text-muted-foreground">{template.items.length} tasks</span>
      </div>

      {/* Mandatory Tasks */}
      {mandatoryItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
            <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Mandatory Tasks ({mandatoryItems.length})
            </h5>
          </div>
          <div className="border rounded-md bg-slate-50/50">
            {mandatoryItems.map((item) => (
              <TaskItemRow
                key={item.id}
                item={item}
                isSelected={true}
                onToggle={() => {}}
                disabled={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional Tasks */}
      {optionalItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Optional Tasks ({optionalItems.length})
            </h5>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllOptional}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Select all
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={deselectAllOptional}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Deselect all
              </button>
            </div>
          </div>
          <div className="border rounded-md">
            {optionalItems.map((item) => (
              <TaskItemRow
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                onToggle={() => handleToggle(item.id)}
                disabled={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        {mandatoryItems.length +
          selectedItemIds.filter((id) => optionalItems.some((item) => item.id === id)).length}{" "}
        tasks will be created
      </div>
    </div>
  );
}
