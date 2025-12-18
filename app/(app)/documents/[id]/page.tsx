"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface DocumentDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  filename: string | null;
  mimeType: string | null;
  fileSize: number | null;
  documentDate: string | null;
  aiSummary: string | null;
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
  const res = await fetch(`/api/documents/${id}/download`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get download URL");
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
  const documentId = params.id as string;

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
              {document.upload && (
                <>
                  <Button variant="outline" onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button onClick={handleDownload}>
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
              onClick={() => router.push(`/cases/${document.matter!.id}`)}
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

        {/* AI Summary */}
        {document.aiSummary && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-slate-900">AI Summary</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">{document.aiSummary}</p>
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

        {/* Metadata */}
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
    </div>
  );
}
