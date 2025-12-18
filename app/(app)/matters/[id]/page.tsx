"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MoreVertical,
  FileText,
  Mail,
  CheckSquare,
  Clock,
  MessageSquare,
  Sparkles,
  ListTodo,
  Calendar as CalendarIcon,
} from "lucide-react";
import { UnifiedTimeline } from "./_components/timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";
import type { Matter } from "@/lib/api/schemas/matters";

async function fetchMatter(id: string): Promise<Matter> {
  const res = await fetch(`/api/matters/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch matter");
  return res.json();
}

async function fetchMatterDocuments(matterId: string) {
  const res = await fetch(`/api/documents?matterId=${matterId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

async function fetchMatterTasks(matterId: string) {
  const res = await fetch(`/api/tasks?matterId=${matterId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchMatterEmails(matterId: string) {
  const res = await fetch(`/api/emails?matterId=${matterId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch emails");
  return res.json();
}

function RiskIndicator({ score }: { score: number | null }) {
  if (score === null) return null;

  const config =
    score >= 70
      ? { color: "text-red-600", bg: "bg-red-100", label: "High Risk" }
      : score >= 40
        ? { color: "text-amber-600", bg: "bg-amber-100", label: "Medium" }
        : { color: "text-emerald-600", bg: "bg-emerald-100", label: "Low Risk" };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

function OverviewTab({ matter }: { matter: Matter }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Case Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500 mb-1">Reference</dt>
              <dd className="text-sm font-mono font-medium">{matter.reference}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Practice Area</dt>
              <dd className="text-sm">{matter.practiceArea.replace("_", " ").toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Billing Type</dt>
              <dd className="text-sm">{matter.billingType.replace("_", " ").toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Status</dt>
              <dd>
                <Badge variant={matter.status === "active" ? "default" : "secondary"}>
                  {matter.status.replace("_", " ").toUpperCase()}
                </Badge>
              </dd>
            </div>
            {matter.keyDeadline && (
              <div>
                <dt className="text-sm text-slate-500 mb-1">Key Deadline</dt>
                <dd className="text-sm font-medium text-red-600">
                  {format(new Date(matter.keyDeadline), "d MMMM yyyy")}
                </dd>
              </div>
            )}
            {matter.openedAt && (
              <div>
                <dt className="text-sm text-slate-500 mb-1">Opened</dt>
                <dd className="text-sm">{format(new Date(matter.openedAt), "d MMM yyyy")}</dd>
              </div>
            )}
          </dl>
        </Card>

        {matter.description && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {matter.description}
            </p>
          </Card>
        )}

        {matter.notes && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {matter.notes}
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Risk Assessment
          </h3>
          <RiskIndicator score={matter.riskScore} />
          {matter.riskAssessedAt && (
            <p className="text-xs text-slate-500 mt-3">
              Last assessed {format(new Date(matter.riskAssessedAt), "d MMM yyyy")}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            AI Actions
          </h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI about this case
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ListTodo className="w-4 h-4 mr-2" />
              Generate tasks
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Suggest calendar items
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DocumentsTab({ matterId }: { matterId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-documents", matterId],
    queryFn: () => fetchMatterDocuments(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!data || data.documents?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No documents yet"
          description="Documents will appear here when uploaded to this case."
          action={
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          }
        />
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> =
      {
        draft: { variant: "secondary", label: "Draft" },
        pending_review: { variant: "outline", label: "Pending Review" },
        approved: { variant: "default", label: "Approved" },
        sent: { variant: "default", label: "Sent" },
      };
    const c = config[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-3">
      {data.documents.map((doc: any) => (
        <Link key={doc.id} href={`/documents/${doc.id}`}>
          <Card className="p-4 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                <p className="text-sm text-slate-500">
                  {doc.type?.replace("_", " ")} • {doc.filename || "No file"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(doc.status)}
                {doc.documentDate && (
                  <span className="text-sm text-slate-500">
                    {format(new Date(doc.documentDate), "d MMM yyyy")}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function completeTask(taskId: string) {
  const res = await fetch(`/api/tasks/${taskId}/complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}

function TasksTab({ matterId }: { matterId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["matter-tasks", matterId],
    queryFn: () => fetchMatterTasks(matterId),
    staleTime: 30_000,
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter-tasks", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", matterId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!data || data.tasks?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No tasks yet"
          description="Tasks for this case will appear here."
          action={
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Tasks with AI
            </Button>
          }
        />
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-slate-100 text-slate-700",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") {
      return <CheckSquare className="w-5 h-5 text-green-600" />;
    }
    if (status === "in_progress") {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    return <CheckSquare className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-3">
      {data.tasks.map((task: any) => (
        <Card key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-start gap-4">
            <div className="mt-0.5">{getStatusIcon(task.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`font-medium ${task.status === "completed" ? "text-slate-500 line-through" : "text-slate-900"}`}
                >
                  {task.title}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="text-xs text-slate-500 mt-2">
                  Due: {format(new Date(task.dueDate), "d MMM yyyy")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.status !== "completed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => completeMutation.mutate(task.id)}
                  disabled={completeMutation.isPending}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  {completeMutation.isPending ? "..." : "Complete"}
                </Button>
              )}
              <Badge
                variant={
                  task.status === "completed"
                    ? "secondary"
                    : task.status === "in_progress"
                      ? "default"
                      : "outline"
                }
              >
                {task.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmailsTab({ matterId }: { matterId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-emails", matterId],
    queryFn: () => fetchMatterEmails(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!data || data.emails?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No emails yet"
          description="Emails related to this case will appear here."
        />
      </Card>
    );
  }

  const getUrgencyBadge = (urgency: number | null) => {
    if (!urgency) return null;
    if (urgency >= 75) return <Badge variant="destructive">Urgent</Badge>;
    if (urgency >= 50) return <Badge variant="default">High</Badge>;
    return null;
  };

  const getSentimentColor = (sentiment: string | null) => {
    const colors: Record<string, string> = {
      frustrated: "border-l-red-500",
      negative: "border-l-orange-500",
      positive: "border-l-green-500",
      neutral: "border-l-slate-300",
    };
    return colors[sentiment || "neutral"] || colors.neutral;
  };

  return (
    <div className="space-y-3">
      {data.emails.map((email: any) => (
        <Card
          key={email.id}
          className={`p-4 border-l-4 ${getSentimentColor(email.aiSentiment)} hover:bg-slate-50 transition-colors`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-slate-900 truncate">{email.subject}</p>
                {getUrgencyBadge(email.aiUrgency)}
              </div>
              <p className="text-sm text-slate-600 mb-1">
                From: {email.fromAddress?.name || email.fromAddress?.email}
              </p>
              {email.aiSummary && (
                <p className="text-sm text-slate-500 line-clamp-2">{email.aiSummary}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {email.aiIntent && (
                  <span className="capitalize">{email.aiIntent.replace("_", " ")}</span>
                )}
                {email.receivedAt && (
                  <span>{format(new Date(email.receivedAt), "d MMM yyyy HH:mm")}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function MatterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matterId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: matter,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => fetchMatter(matterId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !matter) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md">
          <EmptyState
            title="Case not found"
            description="The case you're looking for doesn't exist or you don't have access."
            action={<Button onClick={() => router.push("/matters")}>Back to Cases</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <button
            onClick={() => router.push("/matters")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Cases
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-slate-500">{matter.reference}</span>
                <Badge variant={matter.status === "active" ? "default" : "secondary"}>
                  {matter.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                {matter.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-medium">
                  {matter.practiceArea.replace("_", " ").toUpperCase()}
                </span>
                {matter.riskScore !== null && <RiskIndicator score={matter.riskScore} />}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="w-4 h-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab matter={matter} />
          </TabsContent>

          <TabsContent value="timeline">
            <UnifiedTimeline matterId={matterId} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab matterId={matterId} />
          </TabsContent>

          <TabsContent value="emails">
            <EmailsTab matterId={matterId} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksTab matterId={matterId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
