"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format, isAfter, isBefore, addDays } from "date-fns";
import type { Matter } from "@/lib/api/schemas/matters";

interface MatterListResponse {
  matters: Matter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchMatters(params: {
  page: number;
  search?: string;
  status?: string;
  practiceArea?: string;
}): Promise<MatterListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", params.page.toString());
  searchParams.set("limit", "20");
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.practiceArea) searchParams.set("practiceArea", params.practiceArea);

  const res = await fetch(`/api/matters?${searchParams}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch matters");
  }

  return res.json();
}

function RiskBadge({ score }: { score: number | null }) {
  if (!score) return null;

  const config =
    score >= 70
      ? { color: "bg-red-100 text-red-700 border-red-200", label: "High Risk" }
      : score >= 40
        ? { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Medium Risk" }
        : { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Low Risk" };

  return (
    <Badge variant="outline" className={`text-xs ${config.color} border`}>
      {config.label}
    </Badge>
  );
}

function MatterCard({ matter }: { matter: Matter }) {
  const router = useRouter();

  const hasUrgentDeadline =
    matter.keyDeadline && isBefore(new Date(matter.keyDeadline), addDays(new Date(), 7));

  return (
    <Card
      className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4"
      style={{
        borderLeftColor:
          matter.status === "active"
            ? "#10b981"
            : matter.status === "on_hold"
              ? "#f59e0b"
              : "#94a3b8",
      }}
      onClick={() => router.push(`/matters/${matter.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-mono font-medium text-slate-600">{matter.reference}</span>
            {hasUrgentDeadline && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 text-lg mb-1">{matter.title}</h3>
          {matter.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{matter.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {matter.practiceArea.replace("_", " ").toUpperCase()}
          </Badge>
          <Badge variant={matter.status === "active" ? "default" : "secondary"} className="text-xs">
            {matter.status.replace("_", " ").toUpperCase()}
          </Badge>
          {matter.riskScore !== null && <RiskBadge score={matter.riskScore} />}
        </div>
        {matter.keyDeadline && (
          <span className="text-xs text-slate-500">
            Due {format(new Date(matter.keyDeadline), "d MMM yyyy")}
          </span>
        )}
      </div>
    </Card>
  );
}

export default function MattersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [practiceFilter, setPracticeFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["matters", page, search, statusFilter, practiceFilter],
    queryFn: () =>
      fetchMatters({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        practiceArea: practiceFilter || undefined,
      }),
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cases</h1>
              <p className="text-slate-600 mt-1">Manage all your legal matters</p>
            </div>
            <Button onClick={() => router.push("/matters/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by reference or title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={practiceFilter}
              onChange={(e) => {
                setPracticeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              <option value="">All Practice Areas</option>
              <option value="conveyancing">Conveyancing</option>
              <option value="litigation">Litigation</option>
              <option value="family">Family</option>
              <option value="probate">Probate</option>
              <option value="employment">Employment</option>
              <option value="immigration">Immigration</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8">
            <EmptyState
              title="Failed to load cases"
              description="There was an error loading the case list. Please try again."
            />
          </Card>
        ) : data && data.matters.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="No cases found"
              description={
                search || statusFilter || practiceFilter
                  ? "Try adjusting your filters"
                  : "Get started by creating your first case"
              }
              action={
                !search && !statusFilter && !practiceFilter ? (
                  <Button onClick={() => router.push("/matters/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {data?.matters.map((matter) => (
                <MatterCard key={matter.id} matter={matter} />
              ))}
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <p className="text-sm text-slate-600">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.pagination.total)} of{" "}
                  {data.pagination.total} cases
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
