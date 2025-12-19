"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskNotesList, type TaskNote } from "./task-notes-list";
import { TaskAttachmentsList, type EvidenceAttachment } from "./task-attachments-list";

interface TaskDetailPanelProps {
  taskId: string;
  matterId: string;
  isExpanded: boolean;
  onAddNote: () => void;
  onEditNote?: (note: TaskNote) => void;
  onDeleteNote?: (noteId: string) => void;
  isDeletingNote?: boolean;
  onAddEvidence: () => void;
}

async function fetchTaskNotes(taskId: string): Promise<{ notes: TaskNote[] }> {
  const res = await fetch(`/api/tasks/${taskId}/notes`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch notes");
  }
  return res.json();
}

async function fetchTaskEvidence(taskId: string): Promise<{ evidence: EvidenceAttachment[] }> {
  const res = await fetch(`/api/tasks/${taskId}/evidence`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch evidence");
  }
  return res.json();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    </div>
  );
}

export function TaskDetailPanel({
  taskId,
  matterId,
  isExpanded,
  onAddNote,
  onEditNote,
  onDeleteNote,
  isDeletingNote,
  onAddEvidence,
}: TaskDetailPanelProps) {
  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
  } = useQuery({
    queryKey: ["tasks", taskId, "notes"],
    queryFn: () => fetchTaskNotes(taskId),
    enabled: isExpanded,
    staleTime: 30000,
  });

  const {
    data: evidenceData,
    isLoading: evidenceLoading,
    error: evidenceError,
  } = useQuery({
    queryKey: ["tasks", taskId, "evidence"],
    queryFn: () => fetchTaskEvidence(taskId),
    enabled: isExpanded,
    staleTime: 30000,
  });

  if (!isExpanded) {
    return null;
  }

  const isLoading = notesLoading || evidenceLoading;
  const hasError = notesError || evidenceError;

  return (
    <div
      className="ml-12 mr-4 mb-4 mt-2 p-4 bg-white rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150"
      data-testid="task-detail-panel"
    >
      {hasError && (
        <div className="text-sm text-red-600 py-4 text-center">
          Failed to load task details. Please try again.
        </div>
      )}

      {isLoading && !hasError && (
        <div className="grid grid-cols-2 gap-6">
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      )}

      {!isLoading && !hasError && (
        <div className="grid grid-cols-2 gap-6">
          <TaskNotesList
            notes={notesData?.notes ?? []}
            onAddNote={onAddNote}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
            isDeleting={isDeletingNote}
          />
          <TaskAttachmentsList
            attachments={evidenceData?.evidence ?? []}
            onAddEvidence={onAddEvidence}
          />
        </div>
      )}
    </div>
  );
}
