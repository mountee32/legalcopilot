"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock,
  X,
  SkipForward,
  AlertTriangle,
  MessageSquare,
  FileCheck,
  Shield,
  MoreVertical,
  Check,
  Ban,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import { TaskDetailPanel } from "./task-detail-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";

export interface WorkflowTask {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "skipped" | "not_applicable";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  completedAt: string | null;
  isMandatory: boolean;
  requiresEvidence: boolean;
  requiresVerifiedEvidence: boolean;
  requiredEvidenceTypes: string[] | null;
  requiresApproval: boolean;
  approvalStatus: string | null;
  assigneeId: string | null;
  evidenceCount: number;
  verifiedEvidenceCount: number;
  notesCount: number;
  latestNote: string | null;
  isBlocked: boolean;
  blockingReasons: string[];
}

interface WorkflowTaskRowProps {
  task: WorkflowTask;
  disabled?: boolean;
  onTaskUpdated: () => void;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  in_progress: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  pending: {
    icon: Circle,
    color: "text-slate-400",
    bg: "bg-white",
    border: "border-slate-200",
  },
  cancelled: {
    icon: X,
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  skipped: {
    icon: SkipForward,
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  not_applicable: {
    icon: X,
    color: "text-slate-300",
    bg: "bg-slate-50",
    border: "border-slate-100",
  },
};

async function completeTask(taskId: string) {
  const res = await fetch(`/api/tasks/${taskId}/complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to complete task");
  }
  return res.json();
}

async function skipTask(taskId: string, reason: string) {
  const res = await fetch(`/api/tasks/${taskId}/skip`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to skip task");
  }
  return res.json();
}

async function markNotApplicable(taskId: string, reason: string) {
  const res = await fetch(`/api/tasks/${taskId}/mark-not-applicable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to mark task as not applicable");
  }
  return res.json();
}

async function addNote(taskId: string, content: string) {
  const res = await fetch(`/api/tasks/${taskId}/notes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add note");
  }
  return res.json();
}

async function editNote(taskId: string, noteId: string, content: string) {
  const res = await fetch(`/api/tasks/${taskId}/notes/${noteId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to edit note");
  }
  return res.json();
}

async function deleteNote(taskId: string, noteId: string) {
  const res = await fetch(`/api/tasks/${taskId}/notes/${noteId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete note");
  }
  return res.json();
}

export function WorkflowTaskRow({ task, disabled = false, onTaskUpdated }: WorkflowTaskRowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [naDialogOpen, setNaDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Determine visual status (blocked overrides in_progress/pending)
  const visualStatus =
    task.isBlocked && (task.status === "pending" || task.status === "in_progress")
      ? "blocked"
      : task.status;

  const config =
    visualStatus === "blocked"
      ? {
          icon: AlertTriangle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        }
      : statusConfig[task.status];

  const StatusIcon = config.icon;

  const isResolved =
    task.status === "completed" || task.status === "skipped" || task.status === "not_applicable";

  // Mutations
  const completeMutation = useMutation({
    mutationFn: () => completeTask(task.id),
    onSuccess: () => {
      toast({ title: "Task completed" });
      onTaskUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const skipMutation = useMutation({
    mutationFn: (reason: string) => skipTask(task.id, reason),
    onSuccess: () => {
      toast({ title: "Task skipped" });
      setSkipDialogOpen(false);
      setReason("");
      onTaskUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to skip task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const naMutation = useMutation({
    mutationFn: (reason: string) => markNotApplicable(task.id, reason),
    onSuccess: () => {
      toast({ title: "Task marked as not applicable" });
      setNaDialogOpen(false);
      setReason("");
      onTaskUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (content: string) => addNote(task.id, content),
    onSuccess: () => {
      toast({ title: "Note added" });
      setNoteDialogOpen(false);
      setNoteContent("");
      // Invalidate the notes query to refresh the detail panel
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "notes"] });
      onTaskUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      editNote(task.id, noteId, content),
    onSuccess: () => {
      toast({ title: "Note updated" });
      setNoteDialogOpen(false);
      setNoteContent("");
      setEditingNoteId(null);
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "notes"] });
      onTaskUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(task.id, noteId),
    onSuccess: () => {
      toast({ title: "Note deleted" });
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "notes"] });
      onTaskUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons, dropdowns, or links
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("[role='menu']")) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleEditNote = (note: { id: string; content: string }) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setNoteDialogOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleNoteDialogClose = (open: boolean) => {
    if (!open) {
      setEditingNoteId(null);
      setNoteContent("");
    }
    setNoteDialogOpen(open);
  };

  const handleNoteSave = () => {
    if (editingNoteId) {
      editNoteMutation.mutate({ noteId: editingNoteId, content: noteContent });
    } else {
      noteMutation.mutate(noteContent);
    }
  };

  const isNoteSaving = noteMutation.isPending || editNoteMutation.isPending;

  return (
    <>
      <div
        className={`${config.border} border rounded-lg overflow-hidden transition-all duration-150 cursor-pointer`}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div
          className={`flex items-center justify-between py-3 px-4 ${config.bg} hover:bg-opacity-80 transition-colors`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Expand/Collapse chevron */}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-400" />
            )}

            <StatusIcon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isResolved ? "text-slate-400 line-through" : "text-slate-700"
                  }`}
                >
                  {task.title}
                </span>

                {task.isMandatory && !isResolved && <span className="text-xs text-red-500">*</span>}

                {/* Requirement indicators */}
                {task.requiresEvidence && !isResolved && (
                  <span
                    title={`Evidence: ${task.evidenceCount} attached${
                      task.requiresVerifiedEvidence
                        ? `, ${task.verifiedEvidenceCount} verified`
                        : ""
                    }`}
                  >
                    <FileCheck
                      className={`w-3.5 h-3.5 ${
                        task.evidenceCount > 0 ? "text-emerald-500" : "text-slate-400"
                      }`}
                    />
                  </span>
                )}

                {task.requiresApproval && !isResolved && (
                  <span title={`Approval: ${task.approvalStatus || "not requested"}`}>
                    <Shield
                      className={`w-3.5 h-3.5 ${
                        task.approvalStatus === "approved"
                          ? "text-emerald-500"
                          : task.approvalStatus === "pending"
                            ? "text-amber-500"
                            : "text-slate-400"
                      }`}
                    />
                  </span>
                )}
              </div>

              {/* Blocking reasons or note (only when collapsed) */}
              {!isExpanded && task.isBlocked && task.blockingReasons.length > 0 && (
                <p className="text-xs text-red-600 mt-0.5">
                  {task.blockingReasons.join(" \u00B7 ")}
                </p>
              )}
              {!isExpanded && task.latestNote && !task.isBlocked && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span className="truncate max-w-[300px]">{task.latestNote}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Count badges */}
            {task.notesCount > 0 && (
              <span
                className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                title={`${task.notesCount} note${task.notesCount > 1 ? "s" : ""}`}
              >
                <MessageSquare className="w-3 h-3" />
                {task.notesCount}
              </span>
            )}
            {task.evidenceCount > 0 && (
              <span
                className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                title={`${task.evidenceCount} attachment${task.evidenceCount > 1 ? "s" : ""}`}
              >
                <Paperclip className="w-3 h-3" />
                {task.evidenceCount}
              </span>
            )}

            {/* Date */}
            {task.completedAt ? (
              <span className="text-xs text-slate-500">
                {format(new Date(task.completedAt), "d MMM yyyy")}
              </span>
            ) : task.dueDate ? (
              <span
                className={`text-xs ${
                  new Date(task.dueDate) < new Date()
                    ? "text-red-600 font-medium"
                    : "text-slate-500"
                }`}
              >
                Due {format(new Date(task.dueDate), "d MMM")}
              </span>
            ) : null}

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`text-xs ${config.bg} ${config.color} ${config.border}`}
            >
              {visualStatus === "blocked"
                ? "Blocked"
                : task.status.replace("_", " ").charAt(0).toUpperCase() +
                  task.status.replace("_", " ").slice(1)}
            </Badge>

            {/* Actions Menu */}
            {!disabled && !isResolved && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending || task.isBlocked}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNoteDialogOpen(true)}>
                    <StickyNote className="h-4 w-4 mr-2" />
                    Add Note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSkipDialogOpen(true)}>
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNaDialogOpen(true)}>
                    <Ban className="h-4 w-4 mr-2" />
                    Mark N/A
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Task Detail Panel */}
        <TaskDetailPanel
          taskId={task.id}
          isExpanded={isExpanded}
          onAddNote={() => setNoteDialogOpen(true)}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          isDeletingNote={deleteNoteMutation.isPending}
          onAddEvidence={() => {
            // TODO: Implement evidence dialog
            toast({ title: "Add Evidence", description: "This feature is coming soon." });
          }}
        />
      </div>

      {/* Skip Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Task</DialogTitle>
            <DialogDescription>
              Please provide a reason for skipping this task. This will be recorded for audit
              purposes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for skipping..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => skipMutation.mutate(reason)}
              disabled={!reason.trim() || skipMutation.isPending}
            >
              {skipMutation.isPending ? "Skipping..." : "Skip Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not Applicable Dialog */}
      <Dialog open={naDialogOpen} onOpenChange={setNaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Not Applicable</DialogTitle>
            <DialogDescription>
              Please explain why this task is not applicable to this matter.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNaDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => naMutation.mutate(reason)}
              disabled={!reason.trim() || naMutation.isPending}
            >
              {naMutation.isPending ? "Saving..." : "Mark as N/A"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={handleNoteDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNoteId ? "Edit Note" : "Add Note"}</DialogTitle>
            <DialogDescription>
              {editingNoteId
                ? "Update your note. A new version will be created."
                : "Add a note to this task for context or tracking."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Your note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => handleNoteDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleNoteSave} disabled={!noteContent.trim() || isNoteSaving}>
              {isNoteSaving ? "Saving..." : editingNoteId ? "Update Note" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
