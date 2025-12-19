"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Briefcase, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Matter {
  id: string;
  reference: string;
  title: string;
  clientName?: string;
}

interface MatterAssignProps {
  selectedMatterId: string | null;
  onSelect: (matterId: string | null) => void;
  className?: string;
}

async function fetchMatters(): Promise<{ matters: Matter[] }> {
  const res = await fetch("/api/matters?limit=100", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch matters");
  return res.json();
}

/**
 * Matter search and selection component
 */
export function MatterAssign({ selectedMatterId, onSelect, className }: MatterAssignProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["matters"],
    queryFn: fetchMatters,
    staleTime: 60_000,
  });

  const filteredMatters = useMemo(() => {
    if (!data?.matters) return [];
    if (!search.trim()) return data.matters.slice(0, 5);

    const query = search.toLowerCase();
    return data.matters
      .filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.reference.toLowerCase().includes(query) ||
          m.clientName?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [data?.matters, search]);

  const selectedMatter = useMemo(() => {
    if (!selectedMatterId || !data?.matters) return null;
    return data.matters.find((m) => m.id === selectedMatterId) || null;
  }, [selectedMatterId, data?.matters]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label>Assign to Matter</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matters..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Selected Matter Display */}
      {selectedMatter && (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{selectedMatter.reference}</p>
                <p className="text-xs text-blue-700">{selectedMatter.title}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null)}
              className="text-blue-600 hover:text-blue-700"
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Matter List */}
      {!selectedMatter && (
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : filteredMatters.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              {search ? "No matters found" : "No matters available"}
            </p>
          ) : (
            filteredMatters.map((matter) => (
              <button
                key={matter.id}
                type="button"
                onClick={() => onSelect(matter.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  "hover:border-slate-300 hover:bg-slate-50",
                  selectedMatterId === matter.id && "border-blue-500 bg-blue-50"
                )}
              >
                <Briefcase className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{matter.reference}</p>
                  <p className="truncate text-xs text-slate-500">{matter.title}</p>
                </div>
                {selectedMatterId === matter.id && (
                  <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Skip Option */}
      {!selectedMatter && (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-slate-500"
          onClick={() => onSelect(null)}
        >
          Skip - assign later
        </Button>
      )}
    </div>
  );
}
