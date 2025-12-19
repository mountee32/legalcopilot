"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Search, Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/hooks/use-toast";
import { DocumentUploadWizard } from "@/components/documents/upload-wizard";
import { cn } from "@/lib/utils";

/** Evidence type options matching the database enum */
const EVIDENCE_TYPES = [
  { value: "id_document", label: "ID Document" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "proof_of_funds", label: "Proof of Funds" },
  { value: "source_of_wealth", label: "Source of Wealth" },
  { value: "search_result", label: "Search Result" },
  { value: "signed_authority", label: "Signed Authority" },
  { value: "client_instruction", label: "Client Instruction" },
  { value: "title_document", label: "Title Document" },
  { value: "contract", label: "Contract" },
  { value: "completion_statement", label: "Completion Statement" },
  { value: "land_registry", label: "Land Registry" },
  { value: "other", label: "Other" },
] as const;

interface Document {
  id: string;
  title: string;
  type: string;
  filename: string | null;
  createdAt: string;
}

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  matterId: string;
  /** Pre-select evidence types from task requirements */
  requiredEvidenceTypes?: string[] | null;
  /** Called after evidence is successfully added */
  onSuccess: () => void;
}

type Mode = "select" | "existing" | "upload";

async function fetchMatterDocuments(matterId: string): Promise<{ documents: Document[] }> {
  const res = await fetch(`/api/documents?matterId=${matterId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch documents");
  }
  return res.json();
}

async function addEvidence(
  taskId: string,
  data: { type: string; documentId: string; description?: string }
): Promise<{ evidence: unknown }> {
  const res = await fetch(`/api/tasks/${taskId}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to add evidence" }));
    throw new Error(err.error || "Failed to add evidence");
  }
  return res.json();
}

function formatDocumentType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AddEvidenceDialog({
  open,
  onOpenChange,
  taskId,
  matterId,
  requiredEvidenceTypes,
  onSuccess,
}: AddEvidenceDialogProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("select");
  const [evidenceType, setEvidenceType] = useState<string>(requiredEvidenceTypes?.[0] || "other");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadWizardOpen, setUploadWizardOpen] = useState(false);

  // Fetch matter documents when in "existing" mode
  const {
    data: docsData,
    isLoading: docsLoading,
    error: docsError,
  } = useQuery({
    queryKey: ["matter-documents", matterId],
    queryFn: () => fetchMatterDocuments(matterId),
    enabled: open && mode === "existing",
  });

  // Add evidence mutation
  const addEvidenceMutation = useMutation({
    mutationFn: (data: { type: string; documentId: string; description?: string }) =>
      addEvidence(taskId, data),
    onSuccess: () => {
      toast({ title: "Evidence added successfully" });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "evidence"] });
      onSuccess();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add evidence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setMode("select");
    setEvidenceType(requiredEvidenceTypes?.[0] || "other");
    setSelectedDocumentId(null);
    setDescription("");
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleUploadComplete = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setUploadWizardOpen(false);
    setMode("existing");
    // Refresh documents list to include the new one
    queryClient.invalidateQueries({ queryKey: ["matter-documents", matterId] });
  };

  const handleSubmit = () => {
    if (!selectedDocumentId || !evidenceType) return;

    addEvidenceMutation.mutate({
      type: evidenceType,
      documentId: selectedDocumentId,
      description: description.trim() || undefined,
    });
  };

  // Filter documents by search query
  const filteredDocuments = docsData?.documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.filename?.toLowerCase().includes(query) ||
      doc.type.toLowerCase().includes(query)
    );
  });

  const selectedDocument = docsData?.documents.find((d) => d.id === selectedDocumentId);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Evidence</DialogTitle>
            <DialogDescription>Link a document as evidence for this task.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Evidence Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="evidence-type">Evidence Type</Label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger id="evidence-type">
                  <SelectValue placeholder="Select evidence type" />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                      {requiredEvidenceTypes?.includes(type.value) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Required
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Selection */}
            {mode === "select" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("existing")}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-900">Add Existing</div>
                    <div className="text-xs text-slate-500">Select from matter documents</div>
                  </div>
                </button>

                <button
                  onClick={() => setUploadWizardOpen(true)}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-900">Add New</div>
                    <div className="text-xs text-slate-500">Upload new document</div>
                  </div>
                </button>
              </div>
            )}

            {/* Existing Documents Selection */}
            {mode === "existing" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Document</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMode("select");
                      setSelectedDocumentId(null);
                    }}
                  >
                    Back
                  </Button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Documents List */}
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {docsLoading && (
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-3/4" />
                    </div>
                  )}

                  {docsError && (
                    <div className="p-4 text-sm text-red-600 text-center">
                      Failed to load documents
                    </div>
                  )}

                  {!docsLoading && !docsError && filteredDocuments?.length === 0 && (
                    <div className="p-6 text-center">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">
                        {searchQuery
                          ? "No documents match your search"
                          : "No documents in this matter"}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => setUploadWizardOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Upload a new document
                      </Button>
                    </div>
                  )}

                  {filteredDocuments?.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocumentId(doc.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors",
                        selectedDocumentId === doc.id && "bg-blue-50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0",
                          selectedDocumentId === doc.id
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300"
                        )}
                      >
                        {selectedDocumentId === doc.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900 truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatDocumentType(doc.type)}
                          </Badge>
                          <span>
                            {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Upload New Option */}
                {!docsLoading && filteredDocuments && filteredDocuments.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setUploadWizardOpen(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Document
                  </Button>
                )}

                {/* Description */}
                {selectedDocumentId && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add a note about this evidence..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {mode === "existing" && (
              <Button
                onClick={handleSubmit}
                disabled={!selectedDocumentId || addEvidenceMutation.isPending}
              >
                {addEvidenceMutation.isPending ? "Adding..." : "Add Evidence"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Wizard */}
      <DocumentUploadWizard
        open={uploadWizardOpen}
        onOpenChange={setUploadWizardOpen}
        defaultMatterId={matterId}
        onSuccess={handleUploadComplete}
      />
    </>
  );
}
