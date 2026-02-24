"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Lock,
  GitFork,
  Plus,
  Layers,
  FileText,
  Zap,
  Scale,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { FieldRow } from "@/components/taxonomy/field-row";
import { ForkDialog } from "@/components/taxonomy/fork-dialog";
import { AddCategoryForm } from "@/components/taxonomy/add-category-form";

interface PackDetail {
  pack: {
    id: string;
    name: string;
    key: string;
    version: string;
    practiceArea: string | null;
    isSystem: boolean;
    firmId: string | null;
    parentPackId: string | null;
  };
  categories: Array<{
    id: string;
    key: string;
    label: string;
    description: string | null;
    sortOrder: number;
    fields: Array<{
      id: string;
      key: string;
      label: string;
      dataType: string;
      confidenceThreshold: string;
      requiresHumanReview: boolean;
      sortOrder: number;
    }>;
  }>;
  documentTypes: Array<{
    id: string;
    key: string;
    label: string;
    activatedCategories: string[];
    classificationHints: string | null;
  }>;
  actionTriggers: Array<{
    id: string;
    triggerType: string;
    name: string;
    description: string | null;
    conditionField: string | null;
    conditionOperator: string | null;
    conditionValue: string | null;
    actionTemplate: any;
  }>;
  reconciliationRules: Array<{
    id: string;
    fieldKey: string;
    conflictDetection: string;
    autoApplyThreshold: string;
    mergeStrategy: string | null;
  }>;
}

async function fetchPackDetail(packId: string): Promise<PackDetail> {
  const res = await fetch(`/api/taxonomy/packs/${packId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch pack detail");
  return res.json();
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-800/20 transition-colors"
      >
        <Icon className="h-5 w-5 text-amber-500/60 shrink-0" />
        <h3 className="flex-1 text-base font-serif text-amber-50">{title}</h3>
        <span className="text-xs text-slate-500">{count}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-800/30 pt-4">{children}</div>}
    </Card>
  );
}

export default function TaxonomyPackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const packId = params.packId as string;

  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [addFieldCategoryId, setAddFieldCategoryId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldDataType, setNewFieldDataType] = useState("text");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["taxonomy-pack", packId],
    queryFn: () => fetchPackDetail(packId),
    staleTime: 30_000,
  });

  const updateField = useMutation({
    mutationFn: async ({ fieldId, updates }: { fieldId: string; updates: any }) => {
      const res = await fetch(`/api/taxonomy/packs/${packId}/fields/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxonomy-pack", packId] });
      toast({ title: "Field updated" });
    },
    onError: () => {
      toast({ title: "Failed to update field", variant: "destructive" });
    },
  });

  const deleteField = useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await fetch(`/api/taxonomy/packs/${packId}/fields/${fieldId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxonomy-pack", packId] });
      toast({ title: "Field deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete field", variant: "destructive" });
    },
  });

  const addField = useMutation({
    mutationFn: async ({
      categoryId,
      label,
      dataType,
    }: {
      categoryId: string;
      label: string;
      dataType: string;
    }) => {
      const key = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const res = await fetch(`/api/taxonomy/packs/${packId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, key, label, dataType }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxonomy-pack", packId] });
      setAddFieldCategoryId(null);
      setNewFieldLabel("");
      setNewFieldDataType("text");
      toast({ title: "Field added" });
    },
    onError: () => {
      toast({ title: "Failed to add field", variant: "destructive" });
    },
  });

  const addCategory = useMutation({
    mutationFn: async (data: { key: string; label: string; description?: string }) => {
      const res = await fetch(`/api/taxonomy/packs/${packId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxonomy-pack", packId] });
      setAddCategoryOpen(false);
      toast({ title: "Category added" });
    },
    onError: () => {
      toast({ title: "Failed to add category", variant: "destructive" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await fetch(`/api/taxonomy/packs/${packId}/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxonomy-pack", packId] });
      toast({ title: "Category deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        <Skeleton className="h-8 w-48 bg-slate-800/30 mb-8" />
        <Skeleton className="h-48 bg-slate-800/30 mb-4" />
        <Skeleton className="h-48 bg-slate-800/30" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Pack not found</p>
          <Link href="/settings/taxonomy">
            <Button variant="outline" className="border-slate-700/50 text-slate-300">
              Back to Taxonomy
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { pack, categories, documentTypes, actionTriggers, reconciliationRules } = data;
  const isEditable = !pack.isSystem;

  // Auto-expand all categories on first load
  if (expandedCategories.size === 0 && categories.length > 0) {
    const allIds = new Set(categories.map((c) => c.id));
    setExpandedCategories(allIds);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto">
        {/* Back nav */}
        <Link
          href="/settings/taxonomy"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-200 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Taxonomy
        </Link>

        {/* Pack header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-serif font-light tracking-tight text-amber-50">
                  {pack.name}
                </h1>
                {pack.isSystem ? (
                  <Badge className="bg-blue-900/20 border-blue-800/30 text-blue-300 text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    System
                  </Badge>
                ) : (
                  <Badge className="bg-amber-900/20 border-amber-800/30 text-amber-300 text-xs">
                    Firm
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                {pack.practiceArea && (
                  <span className="capitalize">{pack.practiceArea.replace(/_/g, " ")}</span>
                )}
                <span className="font-mono text-xs">v{pack.version}</span>
                <span className="font-mono text-xs text-slate-600">{pack.key}</span>
              </div>
            </div>

            {pack.isSystem && (
              <Button
                className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                onClick={() => setForkDialogOpen(true)}
              >
                <GitFork className="h-4 w-4 mr-2" />
                Customize
              </Button>
            )}
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-4" />
        </div>

        <div className="space-y-4">
          {/* Categories & Fields */}
          <CollapsibleSection title="Categories & Fields" icon={Layers} count={categories.length}>
            <div className="space-y-3">
              {categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const fields = category.fields.sort((a, b) => a.sortOrder - b.sortOrder);

                  return (
                    <div
                      key={category.id}
                      className="rounded-lg border border-slate-800/50 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 p-3 bg-slate-800/20 hover:bg-slate-800/30 transition-colors">
                        <button
                          className="flex-1 flex items-center gap-2 text-left"
                          onClick={() => toggleCategory(category.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          )}
                          <span className="text-sm font-medium text-amber-100">
                            {category.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            {category.key}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-auto">
                            {fields.length} fields
                          </span>
                        </button>

                        {isEditable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-red-400/60 hover:text-red-400"
                            onClick={() => {
                              if (
                                confirm(`Delete category "${category.label}" and all its fields?`)
                              ) {
                                deleteCategory.mutate(category.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-1">
                          {fields.map((field) => (
                            <FieldRow
                              key={field.id}
                              field={field}
                              isEditable={isEditable}
                              onSave={(fieldId, updates) =>
                                updateField.mutate({ fieldId, updates })
                              }
                              onDelete={(fieldId) => deleteField.mutate(fieldId)}
                              isSaving={updateField.isPending || deleteField.isPending}
                            />
                          ))}

                          {/* Add field inline */}
                          {isEditable && addFieldCategoryId === category.id ? (
                            <div className="p-3 bg-slate-800/40 rounded-lg border border-amber-800/30 space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newFieldLabel}
                                  onChange={(e) => setNewFieldLabel(e.target.value)}
                                  placeholder="Field label"
                                  className="h-7 bg-slate-900/50 border-slate-700/50 text-amber-50 text-xs flex-1"
                                  autoFocus
                                />
                                <select
                                  value={newFieldDataType}
                                  onChange={(e) => setNewFieldDataType(e.target.value)}
                                  className="h-7 bg-slate-900/50 border border-slate-700/50 text-amber-50 text-xs rounded-md px-2"
                                >
                                  <option value="text">text</option>
                                  <option value="number">number</option>
                                  <option value="date">date</option>
                                  <option value="currency">currency</option>
                                  <option value="boolean">boolean</option>
                                  <option value="enum">enum</option>
                                  <option value="array">array</option>
                                </select>
                                <Button
                                  size="sm"
                                  className="h-7 text-[10px] bg-amber-900/40 text-amber-100"
                                  disabled={!newFieldLabel.trim() || addField.isPending}
                                  onClick={() =>
                                    addField.mutate({
                                      categoryId: category.id,
                                      label: newFieldLabel.trim(),
                                      dataType: newFieldDataType,
                                    })
                                  }
                                >
                                  {addField.isPending ? "..." : "Add"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px] text-slate-400"
                                  onClick={() => {
                                    setAddFieldCategoryId(null);
                                    setNewFieldLabel("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            isEditable && (
                              <button
                                onClick={() => setAddFieldCategoryId(category.id)}
                                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-300 transition-colors px-2 py-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add field
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Add category */}
              {isEditable &&
                (addCategoryOpen ? (
                  <AddCategoryForm
                    packId={packId}
                    onSave={(data) => addCategory.mutate(data)}
                    onCancel={() => setAddCategoryOpen(false)}
                    isSaving={addCategory.isPending}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700/50 text-slate-400 hover:text-amber-200"
                    onClick={() => setAddCategoryOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Category
                  </Button>
                ))}
            </div>
          </CollapsibleSection>

          {/* Document Types (read-only) */}
          <CollapsibleSection
            title="Document Types"
            icon={FileText}
            count={documentTypes.length}
            defaultOpen={false}
          >
            {documentTypes.length === 0 ? (
              <p className="text-sm text-slate-500">No document types defined</p>
            ) : (
              <div className="space-y-2">
                {documentTypes.map((dt) => (
                  <div
                    key={dt.id}
                    className="p-3 bg-slate-800/20 rounded-lg border border-slate-800/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-amber-50">{dt.label}</span>
                      <span className="text-[10px] font-mono text-slate-600">{dt.key}</span>
                    </div>
                    {dt.activatedCategories && dt.activatedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dt.activatedCategories.map((cat: string) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="text-[10px] bg-slate-700/20 border-slate-700/30 text-slate-400"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {dt.classificationHints && (
                      <p className="text-[10px] text-slate-500 mt-1.5 italic">
                        {dt.classificationHints}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Action Triggers (read-only) */}
          <CollapsibleSection
            title="Action Triggers"
            icon={Zap}
            count={actionTriggers.length}
            defaultOpen={false}
          >
            {actionTriggers.length === 0 ? (
              <p className="text-sm text-slate-500">No action triggers defined</p>
            ) : (
              <div className="space-y-2">
                {actionTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="p-3 bg-slate-800/20 rounded-lg border border-slate-800/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500/60" />
                      <span className="text-sm text-amber-50">{trigger.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-700/20 border-slate-700/30 text-slate-400"
                      >
                        {trigger.triggerType.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {trigger.description && (
                      <p className="text-xs text-slate-500 ml-5">{trigger.description}</p>
                    )}
                    {trigger.conditionField && (
                      <p className="text-[10px] text-slate-600 ml-5 mt-1 font-mono">
                        {trigger.conditionField} {trigger.conditionOperator}{" "}
                        {trigger.conditionValue}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Reconciliation Rules (read-only) */}
          <CollapsibleSection
            title="Reconciliation Rules"
            icon={Scale}
            count={reconciliationRules.length}
            defaultOpen={false}
          >
            {reconciliationRules.length === 0 ? (
              <p className="text-sm text-slate-500">No reconciliation rules defined</p>
            ) : (
              <div className="space-y-2">
                {reconciliationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 bg-slate-800/20 rounded-lg border border-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-amber-100">{rule.fieldKey}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-700/20 border-slate-700/30 text-slate-400"
                      >
                        {rule.conflictDetection.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[10px] text-slate-500 ml-auto">
                        Auto-apply above {Math.round(parseFloat(rule.autoApplyThreshold) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>

      {/* Fork dialog */}
      <ForkDialog
        packId={packId}
        packName={pack.name}
        open={forkDialogOpen}
        onOpenChange={setForkDialogOpen}
        onForked={(newId) => {
          router.push(`/settings/taxonomy/${newId}`);
        }}
      />
    </div>
  );
}
