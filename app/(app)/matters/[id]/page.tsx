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
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { UnifiedTimeline } from "./_components/timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { TemplateStatusCard } from "@/components/task-templates/template-status-card";
import { SkippedTasksDialog } from "@/components/task-templates/skipped-tasks-dialog";
import { TaskCard, TaskFormDialog, AddFromTemplateDialog } from "@/components/tasks";
import type { Task } from "@/components/tasks";
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

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

async function getDownloadUrl(id: string): Promise<{ url: string }> {
  const res = await fetch(`/api/documents/${id}/download`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get download URL");
  return res.json();
}

function DocumentsTab({ matterId }: { matterId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["matter-documents", matterId],
    queryFn: () => fetchMatterDocuments(matterId),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter-documents", matterId] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      toast({ title: "Document deleted", description: "Document has been removed" });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete document",
        variant: "destructive",
      });
    },
  });

  const handleView = async (id: string) => {
    try {
      const { url } = await getDownloadUrl(id);
      window.open(url, "_blank");
    } catch (err) {
      toast({
        title: "View failed",
        description: "Could not open document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const { url } = await getDownloadUrl(id);
      window.open(url, "_blank");
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Could not download document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (doc: { id: string; title: string }) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDocumentUploaded = () => {
    queryClient.invalidateQueries({ queryKey: ["matter-documents", matterId] });
    setUploadDialogOpen(false);
  };

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
      <>
        <Card className="p-8">
          <EmptyState
            title="No documents yet"
            description="Documents will appear here when uploaded to this case."
            action={
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            }
          />
        </Card>
        <UploadDocumentDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          defaultMatterId={matterId}
          onSuccess={handleDocumentUploaded}
        />
      </>
    );
  }

  return (
    <>
      {/* Header with upload button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Documents ({data.documents.length})
        </h3>
        <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="space-y-3">
        {data.documents.map((doc: any) => (
          <Card
            key={doc.id}
            className="p-4 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Link href={`/documents/${doc.id}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </Link>
              <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0 cursor-pointer">
                <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                <p className="text-sm text-slate-500">
                  {doc.type?.replace("_", " ")} • {doc.filename || "No file"}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                {getStatusBadge(doc.status)}
                {doc.documentDate && (
                  <span className="text-sm text-slate-500">
                    {format(new Date(doc.documentDate), "d MMM yyyy")}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(doc.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick({ id: doc.id, title: doc.title })}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        defaultMatterId={matterId}
        onSuccess={handleDocumentUploaded}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

interface TasksTabProps {
  matterId: string;
  practiceArea: string;
  subType: string | undefined;
}

async function updateTask(taskId: string, updates: Partial<Task>) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

function TasksTab({ matterId, practiceArea, subType }: TasksTabProps) {
  const [showSkippedTasks, setShowSkippedTasks] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
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

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => updateTask(taskId, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter-tasks", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", matterId] });
    },
  });

  const handleTasksChanged = () => {
    queryClient.invalidateQueries({ queryKey: ["matter-tasks", matterId] });
    queryClient.invalidateQueries({ queryKey: ["matter-timeline", matterId] });
  };

  const handleTasksAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["matter-tasks", matterId] });
    queryClient.invalidateQueries({ queryKey: ["matter-timeline", matterId] });
  };

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
      <>
        <TemplateStatusCard
          matterId={matterId}
          onAddSkippedTasks={() => setShowSkippedTasks(true)}
        />
        <Card className="p-8">
          <EmptyState
            title="No tasks yet"
            description="Tasks for this case will appear here. Add tasks manually or from a template."
            action={
              <div className="flex gap-2">
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
                <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Add from Template
                </Button>
              </div>
            }
          />
        </Card>
        <SkippedTasksDialog
          open={showSkippedTasks}
          onOpenChange={setShowSkippedTasks}
          matterId={matterId}
          onTasksAdded={handleTasksAdded}
        />
        <TaskFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          matterId={matterId}
          onSuccess={handleTasksChanged}
        />
        <AddFromTemplateDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          matterId={matterId}
          practiceArea={practiceArea}
          subType={subType}
          onTasksAdded={handleTasksAdded}
        />
      </>
    );
  }

  // Filter out cancelled tasks by default (show active tasks only)
  const activeTasks = data.tasks.filter((task: Task) => task.status !== "cancelled");

  return (
    <>
      <TemplateStatusCard matterId={matterId} onAddSkippedTasks={() => setShowSkippedTasks(true)} />

      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Tasks ({activeTasks.length})</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Add from Template
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {activeTasks.map((task: Task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(t) => setEditingTask(t)}
            onComplete={(taskId) => completeMutation.mutate(taskId)}
            onCancel={(taskId) => cancelMutation.mutate(taskId)}
            isUpdating={completeMutation.isPending || cancelMutation.isPending}
          />
        ))}
      </div>

      {/* Dialogs */}
      <SkippedTasksDialog
        open={showSkippedTasks}
        onOpenChange={setShowSkippedTasks}
        matterId={matterId}
        onTasksAdded={handleTasksAdded}
      />
      <TaskFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        matterId={matterId}
        onSuccess={handleTasksChanged}
      />
      <TaskFormDialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        matterId={matterId}
        task={editingTask ?? undefined}
        onSuccess={handleTasksChanged}
      />
      <AddFromTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        matterId={matterId}
        practiceArea={practiceArea}
        subType={subType}
        onTasksAdded={handleTasksAdded}
      />
    </>
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
            <TasksTab
              matterId={matterId}
              practiceArea={matter.practiceArea}
              subType={matter.subType ?? undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
