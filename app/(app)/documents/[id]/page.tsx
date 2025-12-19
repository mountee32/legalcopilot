"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  User,
  Folder,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Cpu,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ConfidenceBadge, getConfidenceLevel } from "@/components/documents/confidence-badge";
import {
  DocumentMetadataEditor,
  type DocumentMetadata,
  type ExtractedParty,
  type ExtractedDate,
} from "@/components/documents/document-metadata-editor";

interface DocumentDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  filename: string | null;
  mimeType: string | null;
  fileSize: number | null;
  documentDate: string | null;
  recipient: string | null;
  sender: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  aiModel: string | null;
  aiTokensUsed: number | null;
  analyzedAt: string | null;
  extractedParties: ExtractedParty[] | null;
  extractedDates: ExtractedDate[] | null;
  extractedText: string | null;
  chunkedAt: string | null;
  createdAt: string;
  updatedAt: string;
  matter: {
    id: string;
    title: string;
    reference: string;
  } | null;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  upload: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  } | null;
}

async function fetchDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`/api/documents/${id}`, { credentials: "include" });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Document not found");
    throw new Error("Failed to fetch document");
  }
  return res.json();
}

async function getDownloadUrl(id: string): Promise<{ url: string }> {
  const res = await fetch(`/api/documents/${id}/download`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get download URL");
  return res.json();
}

async function updateDocument(
  id: string,
  data: Partial<DocumentMetadata>
): Promise<DocumentDetail> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update document");
  return res.json();
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

async function analyzeDocument(id: string, force: boolean = false): Promise<any> {
  const res = await fetch(`/api/documents/${id}/analyze`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force }),
  });
  if (!res.ok) throw new Error("Failed to analyze document");
  return res.json();
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const documentId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReanalyzeDialogOpen, setIsReanalyzeDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<DocumentMetadata | null>(null);

  const {
    data: document,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => fetchDocument(documentId),
    enabled: !!documentId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<DocumentMetadata>) => updateDocument(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      setIsEditDialogOpen(false);
      toast({ title: "Document updated", description: "Changes saved successfully" });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not save changes",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(documentId),
    onSuccess: () => {
      toast({ title: "Document deleted", description: "Document has been removed" });
      router.push("/documents");
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete document",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeDocument(documentId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      setIsReanalyzeDialogOpen(false);
      toast({ title: "Analysis complete", description: "Document has been re-analyzed" });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Could not analyze document",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async () => {
    try {
      const { url } = await getDownloadUrl(documentId);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleView = async () => {
    try {
      const { url } = await getDownloadUrl(documentId);
      window.open(url, "_blank");
    } catch (err) {
      console.error("View failed:", err);
    }
  };

  const openEditDialog = () => {
    if (document) {
      setEditFormData({
        title: document.title,
        type: document.type,
        status: document.status || "draft",
        documentDate: document.documentDate ? document.documentDate.split("T")[0] : "",
        recipient: document.recipient || "",
        sender: document.sender || "",
        aiSummary: document.aiSummary || "",
        extractedParties: document.extractedParties || [],
        extractedDates: document.extractedDates || [],
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      updateMutation.mutate({
        title: editFormData.title,
        type: editFormData.type,
        status: editFormData.status,
        documentDate: editFormData.documentDate || null,
        recipient: editFormData.recipient || null,
        sender: editFormData.sender || null,
        aiSummary: editFormData.aiSummary || null,
        extractedParties: editFormData.extractedParties,
        extractedDates: editFormData.extractedDates,
      } as any);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="p-8">
            <EmptyState
              icon={FileText}
              title="Document not found"
              description={error?.message || "The document you're looking for doesn't exist."}
              action={<Button onClick={() => router.push("/documents")}>View All Documents</Button>}
            />
          </Card>
        </div>
      </div>
    );
  }

  const hasAnalysis = document.analyzedAt !== null;
  const confidenceLevel = document.aiConfidence ? getConfidenceLevel(document.aiConfidence) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{document.title}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{document.filename || "No file"}</span>
                  <span>-</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              {document.upload && (
                <>
                  <Button variant="outline" size="sm" onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* AI Analysis Section */}
        {hasAnalysis && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="font-semibold text-slate-900">AI Analysis</h2>
              </div>
              <div className="flex items-center gap-2">
                {document.aiConfidence !== null && (
                  <ConfidenceBadge confidence={document.aiConfidence} level={confidenceLevel!} />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReanalyzeDialogOpen(true)}
                  disabled={analyzeMutation.isPending}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${analyzeMutation.isPending ? "animate-spin" : ""}`}
                  />
                  Re-analyze
                </Button>
              </div>
            </div>

            {/* Summary */}
            {document.aiSummary && (
              <div className="mb-4">
                <p className="text-slate-600 leading-relaxed">{document.aiSummary}</p>
              </div>
            )}

            {/* Extracted Parties */}
            {document.extractedParties && document.extractedParties.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Extracted Parties</p>
                <div className="flex flex-wrap gap-2">
                  {document.extractedParties.map((party, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{party.name}</span>
                      <span className="text-xs text-slate-500">({party.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Dates */}
            {document.extractedDates && document.extractedDates.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Key Dates</p>
                <div className="flex flex-wrap gap-2">
                  {document.extractedDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{date.label}</span>
                      <span className="text-xs text-slate-500">{date.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis metadata */}
            <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3 mt-3">
              {document.aiModel && (
                <div className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>{document.aiModel}</span>
                </div>
              )}
              {document.aiTokensUsed && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{document.aiTokensUsed.toLocaleString()} tokens</span>
                </div>
              )}
              {document.analyzedAt && (
                <span>Analyzed {format(new Date(document.analyzedAt), "d MMM yyyy, HH:mm")}</span>
              )}
            </div>
          </Card>
        )}

        {/* No Analysis Yet */}
        {!hasAnalysis && document.upload && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="font-semibold text-slate-900">AI Analysis</h2>
                  <p className="text-sm text-slate-500">This document hasn't been analyzed yet</p>
                </div>
              </div>
              <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                <Sparkles
                  className={`h-4 w-4 mr-2 ${analyzeMutation.isPending ? "animate-pulse" : ""}`}
                />
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze Document"}
              </Button>
            </div>
          </Card>
        )}

        {/* Document Info */}
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Document Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Type</p>
              <Badge variant="secondary">{document.type.replace("_", " ").toUpperCase()}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <Badge variant={document.status === "final" ? "default" : "secondary"}>
                {document.status.toUpperCase()}
              </Badge>
            </div>
            {document.documentDate && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Document Date</p>
                  <p className="text-sm">
                    {format(new Date(document.documentDate), "d MMMM yyyy")}
                  </p>
                </div>
              </div>
            )}
            {document.createdByUser && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Uploaded By</p>
                  <p className="text-sm">{document.createdByUser.name}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Linked Matter */}
        {document.matter && (
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Linked Case</h2>
            <div
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-all"
              onClick={() => router.push(`/matters/${document.matter!.id}`)}
            >
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 font-mono">{document.matter.reference}</p>
                  <p className="font-medium text-slate-900">{document.matter.title}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </div>
          </Card>
        )}

        {/* Extracted Text Preview */}
        {document.extractedText && (
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Extracted Content</h2>
            <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">
                {document.extractedText.slice(0, 2000)}
                {document.extractedText.length > 2000 && "..."}
              </pre>
            </div>
          </Card>
        )}

        {/* File Details */}
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">File Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Created</p>
              <p>{format(new Date(document.createdAt), "d MMM yyyy, HH:mm")}</p>
            </div>
            <div>
              <p className="text-slate-500">Updated</p>
              <p>{format(new Date(document.updatedAt), "d MMM yyyy, HH:mm")}</p>
            </div>
            {document.mimeType && (
              <div>
                <p className="text-slate-500">File Type</p>
                <p>{document.mimeType}</p>
              </div>
            )}
            {document.chunkedAt && (
              <div>
                <p className="text-slate-500">AI Processed</p>
                <p>{format(new Date(document.chunkedAt), "d MMM yyyy")}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document metadata and AI-extracted information
            </DialogDescription>
          </DialogHeader>
          {editFormData && (
            <DocumentMetadataEditor data={editFormData} onChange={setEditFormData} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This action cannot be undone and
              will permanently remove the document and its associated file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Re-analyze Confirmation */}
      <AlertDialog open={isReanalyzeDialogOpen} onOpenChange={setIsReanalyzeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-analyze Document</AlertDialogTitle>
            <AlertDialogDescription>
              This will run a fresh AI analysis on the document. Any manual edits to the extracted
              parties, dates, and summary will be overwritten with new AI-generated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? "Analyzing..." : "Re-analyze"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
