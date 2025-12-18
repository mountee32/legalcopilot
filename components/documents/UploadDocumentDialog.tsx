"use client";

import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Matter {
  id: string;
  reference: string;
  title: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES = [
  { value: "letter_in", label: "Letter In" },
  { value: "letter_out", label: "Letter Out" },
  { value: "email_in", label: "Email In" },
  { value: "email_out", label: "Email Out" },
  { value: "contract", label: "Contract" },
  { value: "court_form", label: "Court Form" },
  { value: "evidence", label: "Evidence" },
  { value: "note", label: "Note" },
  { value: "id_document", label: "ID Document" },
  { value: "financial", label: "Financial" },
  { value: "other", label: "Other" },
];

async function fetchMatters(): Promise<{ matters: Matter[] }> {
  const res = await fetch("/api/matters?limit=1000", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch matters");
  }

  return res.json();
}

export function UploadDocumentDialog({ open, onOpenChange }: UploadDocumentDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matterId, setMatterId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [documentDate, setDocumentDate] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");

  const { data: mattersData, isLoading: mattersLoading } = useQuery({
    queryKey: ["matters"],
    queryFn: fetchMatters,
    staleTime: 60_000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!matterId || !title || !type) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        matterId,
        title,
        type,
      };

      if (file) {
        payload.filename = file.name;
        payload.mimeType = file.type;
        payload.fileSize = file.size;
      }

      if (documentDate) {
        payload.documentDate = documentDate;
      }

      if (recipient) {
        payload.recipient = recipient;
      }

      if (sender) {
        payload.sender = sender;
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to upload document");
      }

      await queryClient.invalidateQueries({ queryKey: ["documents"] });

      setMatterId("");
      setTitle("");
      setType("");
      setFile(null);
      setDocumentDate("");
      setRecipient("");
      setSender("");

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMatterId("");
    setTitle("");
    setType("");
    setFile(null);
    setDocumentDate("");
    setRecipient("");
    setSender("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a new document to a matter. Fill in the required details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="matter">
                Matter <span className="text-red-500">*</span>
              </Label>
              <Select value={matterId} onValueChange={setMatterId} disabled={mattersLoading}>
                <SelectTrigger id="matter">
                  <SelectValue placeholder="Select a matter..." />
                </SelectTrigger>
                <SelectContent>
                  {mattersData?.matters.map((matter) => (
                    <SelectItem key={matter.id} value={matter.id}>
                      {matter.reference} - {matter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Document Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Contract of Sale"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((docType) => (
                    <SelectItem key={docType.value} value={docType.value}>
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File (optional)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.txt"
              />
              {file && (
                <p className="text-xs text-slate-500">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentDate">Document Date (optional)</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient (optional)</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Sender (optional)</Label>
              <Input
                id="sender"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !matterId || !title || !type}>
              <Upload className="h-4 w-4 mr-2" />
              {isSubmitting ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
