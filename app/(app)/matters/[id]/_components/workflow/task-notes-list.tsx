"use client";

import { useState } from "react";
import { Lock, Eye, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";

export interface TaskNote {
  id: string;
  content: string;
  visibility: "internal" | "client_visible";
  authorName: string | null;
  createdAt: string;
}

interface TaskNotesListProps {
  notes: TaskNote[];
  onAddNote: () => void;
  onEditNote?: (note: TaskNote) => void;
  onDeleteNote?: (noteId: string) => void;
  isDeleting?: boolean;
}

export function TaskNotesList({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  isDeleting = false,
}: TaskNotesListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (noteId: string) => {
    setDeleteConfirmId(noteId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId && onDeleteNote) {
      onDeleteNote(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</h4>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onAddNote}>
          <Plus className="h-3 w-3" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
          No notes yet. Add a note to track progress or share updates.
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group p-3 bg-white rounded-lg border border-slate-200 text-sm relative"
            >
              {/* Edit/Delete buttons - shown on hover */}
              {(onEditNote || onDeleteNote) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {onEditNote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                      onClick={() => onEditNote(note)}
                      title="Edit note"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteNote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                      onClick={() => handleDeleteClick(note.id)}
                      title="Delete note"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              <p className="text-slate-700 whitespace-pre-wrap pr-16">{note.content}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span>{note.authorName || "Unknown"}</span>
                <span className="text-slate-300">·</span>
                <span>{format(new Date(note.createdAt), "d MMM yyyy")}</span>
                <span className="text-slate-300">·</span>
                {note.visibility === "internal" ? (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="h-3 w-3" />
                    Internal
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Eye className="h-3 w-3" />
                    Client Visible
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
