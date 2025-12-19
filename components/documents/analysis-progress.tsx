"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AnalysisStatus = "uploading" | "analyzing" | "complete" | "error";

interface AnalysisProgressProps {
  status: AnalysisStatus;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

const statusConfig = {
  uploading: {
    icon: Loader2,
    title: "Uploading document...",
    description: "Please wait while we upload your file",
    iconClass: "animate-spin text-blue-500",
  },
  analyzing: {
    icon: Loader2,
    title: "Analyzing document...",
    description: "AI is extracting metadata and key information",
    iconClass: "animate-spin text-blue-500",
  },
  complete: {
    icon: CheckCircle2,
    title: "Analysis complete",
    description: "Review the extracted information below",
    iconClass: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    title: "Analysis failed",
    description: "Something went wrong during analysis",
    iconClass: "text-red-500",
  },
};

/**
 * Shows progress state during upload and AI analysis
 */
export function AnalysisProgress({ status, error, onRetry, className }: AnalysisProgressProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center py-8 text-center", className)}>
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          status === "error" ? "bg-red-50" : "bg-blue-50"
        )}
      >
        <Icon className={cn("h-8 w-8", config.iconClass)} />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-slate-900">{config.title}</h3>
      <p className="mb-4 text-sm text-slate-500">{error || config.description}</p>

      {status === "error" && onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}

      {(status === "uploading" || status === "analyzing") && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
}
