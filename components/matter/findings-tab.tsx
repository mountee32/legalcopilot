"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Download, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FindingsPanel } from "@/components/pipeline/findings-panel";
import { useToast } from "@/lib/hooks/use-toast";

interface FindingsTabProps {
  matterId: string;
  onReviewSummary?: (summary: {
    pendingCount: number;
    conflictCount: number;
    needsReview: number;
  }) => void;
}

interface StatusCounts {
  pending: number;
  accepted: number;
  rejected: number;
  auto_applied: number;
  conflict: number;
  revised: number;
}

interface ReviewSummary {
  pendingCount: number;
  conflictCount: number;
  needsReview: number;
}

interface FindingsResponse {
  matterId: string;
  total: number;
  statusCounts: StatusCounts;
  reviewSummary: ReviewSummary;
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
  { key: "revised", label: "Revised" },
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

async function reviseFinding(id: string, correctedValue: string, correctionScope: "case" | "firm") {
  const res = await fetch(`/api/pipeline/findings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "revised", correctedValue, correctionScope }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to revise finding");
  return res.json();
}

async function batchResolveFindings(findingIds: string[], status: "accepted" | "rejected") {
  const res = await fetch("/api/pipeline/findings/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ findingIds, status }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to batch resolve findings");
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

export function FindingsTab({ matterId, onReviewSummary }: FindingsTabProps) {
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

  // Propagate review summary to parent via callback
  useEffect(() => {
    if (data?.reviewSummary && onReviewSummary) {
      onReviewSummary(data.reviewSummary);
    }
  }, [data?.reviewSummary, onReviewSummary]);

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

  const revise = useMutation({
    mutationFn: ({
      id,
      correctedValue,
      scope,
    }: {
      id: string;
      correctedValue: string;
      scope: "case" | "firm";
    }) => reviseFinding(id, correctedValue, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter-findings-all", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      toast({ title: "Finding corrected" });
    },
    onError: () => {
      toast({ title: "Failed to correct finding", variant: "destructive" });
    },
  });

  const batchResolve = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: "accepted" | "rejected" }) =>
      batchResolveFindings(ids, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matter-findings-all", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      toast({ title: `${data.updated} findings resolved` });
    },
    onError: () => {
      toast({ title: "Failed to batch resolve findings", variant: "destructive" });
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

  // Collect IDs for batch actions
  const pendingIds = allFindings.filter((f: any) => f.status === "pending").map((f: any) => f.id);
  const conflictIds = allFindings.filter((f: any) => f.status === "conflict").map((f: any) => f.id);
  const reviewableIds = [...pendingIds, ...conflictIds];

  const totalAcrossAllStatuses = statusCounts
    ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
    : 0;

  if (!data || totalAcrossAllStatuses === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No findings yet"
          description="Pipeline findings will appear here once documents are processed through the AI analysis pipeline."
        />
      </Card>
    );
  }

  const isBusy = resolve.isPending || revise.isPending || batchResolve.isPending;

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

      {/* Batch action buttons */}
      {reviewableIds.length > 0 && (
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-500 mr-1">
            {reviewableIds.length} findings need review
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
            onClick={() => batchResolve.mutate({ ids: pendingIds, status: "accepted" })}
            disabled={isBusy || pendingIds.length === 0}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accept All Pending ({pendingIds.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
            onClick={() => batchResolve.mutate({ ids: reviewableIds, status: "rejected" })}
            disabled={isBusy || reviewableIds.length === 0}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Reject All ({reviewableIds.length})
          </Button>
        </div>
      )}

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
      {allFindings.length === 0 && statusFilter !== "all" ? (
        <Card className="p-6 text-center text-sm text-slate-400">
          No findings match the &ldquo;{STATUS_FILTERS.find((f) => f.key === statusFilter)?.label}
          &rdquo; filter.{" "}
          <button className="text-blue-500 hover:underline" onClick={() => setStatusFilter("all")}>
            Show all
          </button>
        </Card>
      ) : (
        <FindingsPanel
          findings={allFindings}
          onResolve={(id, status) => resolve.mutate({ id, status })}
          onRevise={(id, correctedValue, scope) => revise.mutate({ id, correctedValue, scope })}
          isResolving={isBusy}
        />
      )}
    </div>
  );
}
