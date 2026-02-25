"use client";

import { useState } from "react";
import { UsersRound, RefreshCw, Calendar, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTeamData,
  useLeaveRequests,
  useCreateLeave,
  useApproveLeave,
  useRejectLeave,
} from "@/lib/hooks/use-team-data";

const LEAVE_STATUSES = ["all", "pending", "approved", "rejected"] as const;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  parental: "Parental Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

export default function TeamPage() {
  const [tab, setTab] = useState<"overview" | "leave">("overview");

  return (
    <div className="min-h-screen bg-slate-50" data-testid="team-page">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <UsersRound className="h-6 w-6 text-slate-700" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Team</h1>
              <p className="text-sm text-slate-500">Capacity, workload, and leave management</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border bg-white p-0.5 w-fit">
            <button
              onClick={() => setTab("overview")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "overview" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("leave")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "leave" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Leave
            </button>
          </div>

          {tab === "overview" ? <OverviewTab /> : <LeaveTab />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { capacity, workload, isLoading, isError, refetch } = useTeamData();

  if (isLoading) return <TeamSkeleton />;
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Failed to load team data.</p>
        <Button variant="outline" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  const summary = capacity?.summary;
  const members = capacity?.teamMembers ?? [];
  const workloadMap = new Map((workload?.teamMembers ?? []).map((m) => [m.userId, m]));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Team Size" value={members.length} />
        <KpiCard
          label="Avg Utilisation"
          value={summary ? `${Math.round(summary.averageUtilization)}%` : "—"}
        />
        <KpiCard label="Pending Tasks" value={workload?.summary.totalPendingTasks ?? 0} />
        <KpiCard
          label="Avg Workload"
          value={
            workload?.summary.averageWorkloadScore != null
              ? `${Math.round(workload.summary.averageWorkloadScore)}%`
              : "—"
          }
        />
      </div>

      {/* Team member cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Team Members</h2>
        <Button variant="outline" size="sm" onClick={refetch} className="h-8">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No team members found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const wl = workloadMap.get(member.userId);
            return (
              <div key={member.userId} className="rounded-lg border bg-white p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.userName}</p>
                  <p className="text-xs text-slate-500">{member.userEmail}</p>
                </div>
                {/* Utilisation bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Utilisation</span>
                    <span>{Math.round(member.utilization)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        member.utilization > 90
                          ? "bg-red-500"
                          : member.utilization > 70
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(member.utilization, 100)}%` }}
                    />
                  </div>
                </div>
                {/* Stats */}
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{member.activeMatters} matters</span>
                  <span>{wl?.pendingTasks ?? 0} tasks</span>
                  <span>{wl?.upcomingDeadlines ?? 0} deadlines</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeaveTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useLeaveRequests(statusFilter);
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const requests = data?.leaveRequests ?? [];

  return (
    <div className="space-y-4">
      {/* Filter pills + request button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {LEAVE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Request Leave
        </Button>
      </div>

      {/* Request Leave Dialog */}
      {showForm && <LeaveRequestForm onClose={() => setShowForm(false)} />}

      {/* Leave cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No leave requests found.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="rounded-lg border bg-white p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">
                    {LEAVE_TYPE_LABELS[req.type] ?? req.type}
                  </span>
                  <LeaveStatusBadge status={req.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {req.startDate} to {req.endDate} ({req.daysCount} day
                  {req.daysCount !== 1 ? "s" : ""})
                </p>
                {req.reason && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{req.reason}</p>
                )}
              </div>
              {req.status === "pending" && (
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => approveMutation.mutate(req.id)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaveRequestForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateLeave();
  const [type, setType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      { type: type as "annual", startDate, endDate, reason: reason || undefined },
      { onSuccess: () => onClose() }
    );
  }

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">New Leave Request</h3>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
          >
            {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
            placeholder="Holiday, medical appointment, etc."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Start Date</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">End Date</label>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
}

function LeaveStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border ${
        styles[status] ?? styles.cancelled
      }`}
    >
      {status}
    </span>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}
