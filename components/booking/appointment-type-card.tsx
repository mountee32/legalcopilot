"use client";

import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppointmentTypeCardProps {
  id: string;
  name: string;
  description: string | null;
  practiceArea: string | null;
  duration: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AppointmentTypeCard({
  id,
  name,
  description,
  practiceArea,
  duration,
  selected = false,
  onClick,
  className,
}: AppointmentTypeCardProps) {
  return (
    <Card
      className={cn(
        "p-6 cursor-pointer transition-all hover:shadow-lg",
        "bg-slate-900/40 border-slate-800/50 backdrop-blur-sm",
        selected && "border-amber-600/50 bg-amber-950/20 ring-2 ring-amber-600/30",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-serif text-amber-50 mb-1">{name}</h3>
          {description && <p className="text-sm text-slate-400 line-clamp-2 mb-3">{description}</p>}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="h-4 w-4" />
              <span>{duration} mins</span>
            </div>
            {practiceArea && (
              <Badge
                variant="outline"
                className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
              >
                {practiceArea}
              </Badge>
            )}
          </div>
        </div>
        {selected && (
          <div className="flex-shrink-0">
            <div className="h-6 w-6 rounded-full bg-amber-600 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
