"use client";

import Link from "next/link";
import { Lock, GitFork, Layers, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TaxonomyPack {
  id: string;
  name: string;
  key: string;
  version: string;
  practiceArea: string | null;
  isSystem: boolean;
  parentPackId: string | null;
  categoryCount: number;
  fieldCount: number;
}

interface PackListCardProps {
  pack: TaxonomyPack;
  onCustomize?: (packId: string) => void;
}

export function PackListCard({ pack, onCustomize }: PackListCardProps) {
  return (
    <div className="p-5 bg-slate-800/20 rounded-lg border border-slate-800/50 hover:bg-slate-800/40 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-serif text-base text-amber-50 truncate">{pack.name}</h3>
            {pack.isSystem ? (
              <Badge
                variant="outline"
                className="bg-blue-900/20 border-blue-800/30 text-blue-300 text-[10px] shrink-0"
              >
                <Lock className="h-2.5 w-2.5 mr-1" />
                System
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-amber-900/20 border-amber-800/30 text-amber-300 text-[10px] shrink-0"
              >
                Firm
              </Badge>
            )}
            {pack.parentPackId && (
              <Badge
                variant="outline"
                className="bg-slate-700/20 border-slate-700/30 text-slate-400 text-[10px] shrink-0"
              >
                <GitFork className="h-2.5 w-2.5 mr-1" />
                Fork
              </Badge>
            )}
          </div>

          {pack.practiceArea && (
            <span className="text-xs text-slate-400 capitalize">
              {pack.practiceArea.replace(/_/g, " ")}
            </span>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {pack.categoryCount} categories
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {pack.fieldCount} fields
            </span>
            <span className="font-mono text-[10px]">v{pack.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pack.isSystem && onCustomize && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-800/30 bg-amber-900/20 hover:bg-amber-900/40 text-amber-200 text-xs"
              onClick={() => onCustomize(pack.id)}
            >
              <GitFork className="h-3 w-3 mr-1" />
              Customize
            </Button>
          )}
          <Link href={`/settings/taxonomy/${pack.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300 text-xs"
            >
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
