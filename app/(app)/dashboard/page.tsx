"use client";

import { useRouter } from "next/navigation";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { useToast } from "@/lib/hooks/use-toast";
import {
  DashboardGreeting,
  AIBriefingCard,
  UrgentItemsCard,
  ApprovalQueueCard,
  TasksTodayCard,
  CalendarTodayCard,
  FirmSnapshotCard,
  DashboardSkeleton,
} from "@/components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useDashboardData();

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast({ title: "Approved", description: "Request approved successfully" });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to approve request", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast({ title: "Rejected", description: "Request rejected" });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
    }
  };

  const handleTaskComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete task");
      toast({ title: "Completed", description: "Task marked as complete" });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to complete task", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold mb-2">Failed to load dashboard</h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading the dashboard data.
            </p>
            <button onClick={() => refetch()} className="text-primary hover:underline">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" data-testid="dashboard-page">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Greeting */}
        <DashboardGreeting />

        {/* Top row: AI Briefing + Urgent Items */}
        <div className="grid gap-4 md:grid-cols-2">
          <AIBriefingCard
            taskCount={data.tasksTotal}
            emailCount={0}
            meetingCount={data.calendarEvents.length}
          />
          <UrgentItemsCard items={data.urgentItems} />
        </div>

        {/* Approval Queue - full width */}
        <ApprovalQueueCard
          approvals={data.approvals}
          total={data.approvalsTotal}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* Bottom row: Tasks + Calendar */}
        <div className="grid gap-4 md:grid-cols-2">
          <TasksTodayCard
            tasks={data.tasks}
            total={data.tasksTotal}
            onComplete={handleTaskComplete}
          />
          <CalendarTodayCard events={data.calendarEvents} />
        </div>

        {/* Firm Snapshot - full width */}
        <FirmSnapshotCard
          activeCases={data.activeCases}
          wipValue={data.wipValue}
          collectedMTD={data.collectedMTD}
          overdueInvoices={data.overdueInvoices}
        />
      </div>
    </div>
  );
}
