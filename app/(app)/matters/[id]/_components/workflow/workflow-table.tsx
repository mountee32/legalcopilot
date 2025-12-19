"use client";

import { cn } from "@/lib/utils";

// Shared grid classes for consistent column alignment across stage and task rows
export const TABLE_GRID_CLASSES = "grid grid-cols-[40%_12%_18%_18%_12%] gap-2";

interface WorkflowTableProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkflowTable({ children, className }: WorkflowTableProps) {
  return (
    <div
      className={cn("bg-slate-50 rounded-lg border border-slate-200 overflow-hidden", className)}
    >
      {/* Table Header */}
      <div
        className={cn(
          TABLE_GRID_CLASSES,
          "px-4 py-3 bg-white border-b border-slate-200",
          "text-xs font-medium text-slate-500 uppercase tracking-wider"
        )}
      >
        <div className="flex items-center">Name</div>
        <div className="flex items-center">Status</div>
        <div className="flex items-center">Progress</div>
        <div className="flex items-center">Remarks</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}
