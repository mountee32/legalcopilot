"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TemplateStatusResponse } from "@/lib/api/schemas/task-templates";

interface TemplateStatusCardProps {
  matterId: string;
  onAddSkippedTasks: () => void;
  onViewTemplate?: (templateId: string) => void;
}

export function TemplateStatusCard({
  matterId,
  onAddSkippedTasks,
  onViewTemplate,
}: TemplateStatusCardProps) {
  const [status, setStatus] = useState<TemplateStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/matters/${matterId}/template-status`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) {
            // No template status is fine - just means no template applied
            setStatus({ applications: [], skippedItems: [], availableTemplates: [] });
          } else {
            throw new Error("Failed to fetch template status");
          }
        } else {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [matterId]);

  if (isLoading) {
    return (
      <div className="mb-4 p-4 border rounded-lg bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - template status is not critical
  }

  if (!status || status.applications.length === 0) {
    // No template applied - optionally show available templates
    if (status?.availableTemplates && status.availableTemplates.length > 0) {
      return (
        <div className="mb-4 p-4 border border-dashed rounded-lg bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">No task template applied</span>
            </div>
            <Button variant="outline" size="sm" onClick={onAddSkippedTasks} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Apply Template
            </Button>
          </div>
        </div>
      );
    }
    return null; // No template applied and none available
  }

  // Show applied template info
  const application = status.applications[0]; // Show most recent
  const hasSkippedItems = status.skippedItems.length > 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-blue-50/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Template Applied</span>
          </div>
          <p className="text-sm text-slate-700 mt-1">{application.templateName}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(application.appliedAt)}
            </span>
            {application.appliedByName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {application.appliedByName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onViewTemplate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewTemplate(application.templateId)}
              className="h-8"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View
            </Button>
          )}
          {hasSkippedItems && (
            <Button variant="outline" size="sm" onClick={onAddSkippedTasks} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Skipped ({status.skippedItems.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
