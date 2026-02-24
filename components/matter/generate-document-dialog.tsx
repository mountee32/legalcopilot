"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";

interface GenerateDocumentDialogProps {
  matterId: string;
  practiceArea: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Template {
  id: string;
  name: string;
  type: string;
  category: string | null;
  content: string;
  mergeFields: any;
  firmId: string | null;
}

const AI_MARKER_REGEX = /\{\{AI:[a-zA-Z_]+\}\}/;

async function fetchTemplates(): Promise<{ templates: Template[] }> {
  const res = await fetch("/api/templates?type=document&includeSystem=true", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

async function generateDocument(
  matterId: string,
  templateId: string
): Promise<{
  document: { id: string; title: string; type: string; status: string; filename: string };
  aiSections: string[];
  missingFields: string[];
  tokensUsed: number;
}> {
  const res = await fetch(`/api/matters/${matterId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Generation failed" }));
    throw new Error(err.message || "Failed to generate document");
  }
  return res.json();
}

export function GenerateDocumentDialog({
  matterId,
  practiceArea,
  open,
  onOpenChange,
}: GenerateDocumentDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["templates", "document"],
    queryFn: fetchTemplates,
    enabled: open,
    staleTime: 60_000,
  });

  const generate = useMutation({
    mutationFn: (templateId: string) => generateDocument(matterId, templateId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["matter-documents", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", matterId] });
      toast({
        title: "Document generated",
        description: `${result.document.title} created as draft`,
      });
      onOpenChange(false);
      setSelectedTemplateId(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Filter templates: show matching practice area first, then all others
  const templates = data?.templates || [];
  const matchingTemplates = templates.filter((t) => t.category === practiceArea);
  const otherTemplates = templates.filter((t) => t.category !== practiceArea);
  const sortedTemplates = [...matchingTemplates, ...otherTemplates];

  const getMergeFieldCount = (t: Template): number => {
    if (Array.isArray(t.mergeFields)) return t.mergeFields.length;
    if (t.mergeFields && typeof t.mergeFields === "object")
      return Object.keys(t.mergeFields).length;
    return 0;
  };

  const hasAiMarkers = (t: Template): boolean => AI_MARKER_REGEX.test(t.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Document</DialogTitle>
          <DialogDescription>
            Select a template to generate a document using extracted findings data.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : sortedTemplates.length === 0 ? (
          <EmptyState
            title="No templates available"
            description="Create a document template in Settings to get started."
          />
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {sortedTemplates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const isAiEnhanced = hasAiMarkers(template);
              const fieldCount = getMergeFieldCount(template);
              const matchesPracticeArea = template.category === practiceArea;

              return (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all hover:border-slate-400 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isAiEnhanced ? "bg-purple-100" : "bg-blue-100"
                      }`}
                    >
                      {isAiEnhanced ? (
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {template.name}
                        </p>
                        {isAiEnhanced && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-purple-100 text-purple-700"
                          >
                            AI-enhanced
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {template.category && (
                          <span className="capitalize">{template.category.replace(/_/g, " ")}</span>
                        )}
                        <span>{fieldCount} merge fields</span>
                        {template.firmId === null && <span>System template</span>}
                        {matchesPracticeArea && (
                          <Badge variant="outline" className="text-xs">
                            Matches practice area
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedTemplateId && generate.mutate(selectedTemplateId)}
            disabled={!selectedTemplateId || generate.isPending}
          >
            {generate.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
