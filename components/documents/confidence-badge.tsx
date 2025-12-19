"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConfidenceLevel = "green" | "amber" | "red";

interface ConfidenceBadgeProps {
  confidence: number;
  level?: ConfidenceLevel;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return "green";
  if (confidence >= 50) return "amber";
  return "red";
}

/**
 * Get label for confidence level
 */
export function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "green":
      return "High confidence";
    case "amber":
      return "Review recommended";
    case "red":
      return "Manual review required";
  }
}

/**
 * RAG (Red/Amber/Green) confidence indicator badge
 */
export function ConfidenceBadge({
  confidence,
  level,
  showPercentage = true,
  className,
}: ConfidenceBadgeProps) {
  const computedLevel = level ?? getConfidenceLevel(confidence);
  const label = getConfidenceLabel(computedLevel);

  const colorClasses = {
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };

  const dotClasses = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <Badge variant="outline" className={cn(colorClasses[computedLevel], "gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full", dotClasses[computedLevel])} />
      {showPercentage && <span>{confidence}%</span>}
      <span className="hidden sm:inline">- {label}</span>
    </Badge>
  );
}
