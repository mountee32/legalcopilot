"use client";

import { forwardRef } from "react";
import { FileText, FolderKanban, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchItemProps {
  type: "matter" | "client" | "document";
  label: string;
  sublabel?: string;
  snippet?: string;
  onSelect?: () => void;
}

const iconMap = {
  matter: FolderKanban,
  client: Users,
  document: FileText,
};

const colorMap = {
  matter: "text-blue-600",
  client: "text-green-600",
  document: "text-orange-600",
};

export const SearchItem = forwardRef<HTMLDivElement, SearchItemProps>(
  ({ type, label, sublabel, snippet, onSelect }, ref) => {
    const Icon = iconMap[type];
    const iconColor = colorMap[type];

    return (
      <div
        ref={ref}
        className="flex items-start gap-3 rounded-md px-2 py-2.5 cursor-pointer hover:bg-accent"
        onClick={onSelect}
      >
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{label}</div>
          {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
          {snippet && (
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{snippet}</div>
          )}
        </div>
      </div>
    );
  }
);

SearchItem.displayName = "SearchItem";
