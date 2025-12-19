"use client";

import { FileText, CheckCircle2, Clock, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface EvidenceAttachment {
  id: string;
  type: string;
  description: string | null;
  documentId: string | null;
  documentName: string | null;
  addedByName: string | null;
  addedAt: string;
  verifiedAt: string | null;
}

interface TaskAttachmentsListProps {
  attachments: EvidenceAttachment[];
  onAddEvidence: () => void;
}

function formatEvidenceType(type: string): string {
  return type
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function TaskAttachmentsList({ attachments, onAddEvidence }: TaskAttachmentsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Attachments
        </h4>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onAddEvidence}>
          <Plus className="h-3 w-3" />
          Add Evidence
        </Button>
      </div>

      {attachments.length === 0 ? (
        <div className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
          No attachments yet. Add evidence to support task completion.
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {attachment.documentName || attachment.description || "Untitled"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-50 text-slate-600 border-slate-200"
                      >
                        {formatEvidenceType(attachment.type)}
                      </Badge>
                      {attachment.verifiedAt ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Added by {attachment.addedByName || "Unknown"} ·{" "}
                      {format(new Date(attachment.addedAt), "d MMM yyyy")}
                    </p>
                  </div>
                </div>

                {attachment.documentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 flex-shrink-0"
                    asChild
                  >
                    <a href={`/api/documents/${attachment.documentId}/download`} download>
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
