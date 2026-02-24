"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FindingsPanel } from "@/components/pipeline/findings-panel";
import { useToast } from "@/lib/hooks/use-toast";

interface FindingsTabProps {
  matterId: string;
}

interface StatusCounts {
  pending: number;
  accepted: number;
  rejected: number;
  auto_applied: number;
  conflict: number;
}

interface FindingsResponse {
  matterId: string;
  total: number;
  statusCounts: StatusCounts;
  categories: {
    categoryKey: string;
    findings: any[];
    count: number;
  }[];
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "conflict", label: "Conflicts" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "auto_applied", label: "Auto-applied" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

async function fetchFindings(
  matterId: string,
  status?: string,
  category?: string
): Promise<FindingsResponse> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (category) params.set("category", category);
  const qs = params.toString();
  const res = await fetch(`/api/matters/${matterId}/findings${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch findings");
  return res.json();
}

async function resolveFinding(id: string, status: "accepted" | "rejected") {
  const res = await fetch(`/api/pipeline/findings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to resolve finding");
  return res.json();
}

async function recalculateRisk(matterId: string) {
  const res = await fetch(`/api/matters/${matterId}/risk/recalculate`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to recalculate risk");
  return res.json();
}

export function FindingsTab({ matterId }: FindingsTabProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["matter-findings-all", matterId, statusFilter, categoryFilter],
    queryFn: () =>
      fetchFindings(
        matterId,
        statusFilter !== "all" ? statusFilter : undefined,
        categoryFilter ?? undefined
      ),
    staleTime: 15_000,
  });

  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      resolveFinding(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter-findings-all", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      toast({ title: "Finding resolved" });
    },
    onError: () => {
      toast({ title: "Failed to resolve finding", variant: "destructive" });
    },
  });

  const recalc = useMutation({
    mutationFn: () => recalculateRisk(matterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter-findings-all", matterId] });
      toast({ title: "Risk score recalculated" });
    },
    onError: () => {
      toast({ title: "Failed to recalculate risk", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Use the all-filter data for status counts (always fetch unfiltered counts)
  const statusCounts = data?.statusCounts;
  const allFindings = data?.categories?.flatMap((c) => c.findings) || [];
  const categoryKeys = data ? [...new Set(data.categories.map((c) => c.categoryKey))] : [];

  if (!data || allFindings.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No findings yet"
          description="Pipeline findings will appear here once documents are processed through the AI analysis pipeline."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status summary pills */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((sf) => {
            const count =
              sf.key === "all"
                ? Object.values(statusCounts || {}).reduce((a, b) => a + b, 0)
                : (statusCounts?.[sf.key as keyof StatusCounts] ?? 0);

            return (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(sf.key)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${
                    statusFilter === sf.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {sf.label}
                <span
                  className={`tabular-nums ${
                    statusFilter === sf.key ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/api/matters/${matterId}/export/findings`, "_blank")}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => recalc.mutate()}
            disabled={recalc.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalc.isPending ? "animate-spin" : ""}`} />
            {recalc.isPending ? "Calculating..." : "Recalculate Risk"}
          </Button>
        </div>
      </div>

      {/* Category filter chips */}
      {categoryKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={categoryFilter === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryFilter(null)}
          >
            All categories
          </Badge>
          {categoryKeys.map((key) => (
            <Badge
              key={key}
              variant={categoryFilter === key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
            >
              {key.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      )}

      {/* Findings panel (reuses existing component) */}
      <FindingsPanel
        findings={allFindings}
        onResolve={(id, status) => resolve.mutate({ id, status })}
        isResolving={resolve.isPending}
      />
    </div>
  );
}
