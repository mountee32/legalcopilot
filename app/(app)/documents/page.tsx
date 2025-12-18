"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Upload, Search, Download, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import type { Document } from "@/lib/api/schemas/documents";

interface DocumentListResponse {
  documents: Document[];
}

async function fetchDocuments(matterId?: string): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  if (matterId) params.set("matterId", matterId);

  const res = await fetch(`/api/documents?${params}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch documents");
  }

  return res.json();
}

function DocumentTypeIcon({ type }: { type: string }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
      <FileText className="w-5 h-5 text-blue-600" />
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  const router = useRouter();

  return (
    <Card
      className="p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={() => router.push(`/documents/${document.id}`)}
    >
      <div className="flex items-start gap-4">
        <DocumentTypeIcon type={document.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 truncate mb-1">{document.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{document.filename || "Untitled"}</span>
                {document.fileSize && (
                  <>
                    <span>•</span>
                    <span>{(document.fileSize / 1024).toFixed(0)} KB</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs ml-2">
              {document.type.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          {document.aiSummary && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{document.aiSummary}</p>
          )}

          <div className="flex items-center gap-2">
            {document.documentDate && (
              <span className="text-xs text-slate-500">
                {format(new Date(document.documentDate), "d MMM yyyy")}
              </span>
            )}
            {document.chunkedAt && (
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Processed
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matterId = searchParams.get("matterId") || undefined;
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents", matterId],
    queryFn: () => fetchDocuments(matterId),
    staleTime: 30_000,
  });

  const filteredDocuments = data?.documents.filter((doc) =>
    search
      ? doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.filename?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
              <p className="text-slate-600 mt-1">
                {matterId ? "Case documents with AI insights" : "All documents"}
              </p>
            </div>
            <Button onClick={() => router.push("/documents/upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8">
            <EmptyState
              title="Failed to load documents"
              description="There was an error loading the documents. Please try again."
            />
          </Card>
        ) : !filteredDocuments || filteredDocuments.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={FileText}
              title={search ? "No documents found" : "No documents yet"}
              description={
                search
                  ? "Try adjusting your search"
                  : "Upload documents or generate them from templates to see them here."
              }
              action={
                !search ? (
                  <Button onClick={() => router.push("/documents/upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
