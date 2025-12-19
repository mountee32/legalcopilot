"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult, ReviewFormData } from "@/components/documents/analysis-review";
import type { AnalysisStatus } from "@/components/documents/analysis-progress";

interface UseDocumentUploadOptions {
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
}

interface DocumentUploadState {
  step: 1 | 2 | 3 | 4;
  file: File | null;
  uploadId: string | null;
  documentId: string | null;
  analysis: AnalysisResult | null;
  formData: ReviewFormData;
  matterId: string | null;
  status: AnalysisStatus;
  error: string | null;
  isSubmitting: boolean;
}

const initialFormData: ReviewFormData = {
  title: "",
  type: "other",
  documentDate: "",
  summary: "",
};

const initialState: DocumentUploadState = {
  step: 1,
  file: null,
  uploadId: null,
  documentId: null,
  analysis: null,
  formData: initialFormData,
  matterId: null,
  status: "uploading",
  error: null,
  isSubmitting: false,
};

/**
 * Hook to orchestrate the document upload and analysis flow
 */
export function useDocumentUpload(options: UseDocumentUploadOptions = {}) {
  const [state, setState] = useState<DocumentUploadState>(initialState);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file, error: null }));
  }, []);

  const setMatterId = useCallback((matterId: string | null) => {
    setState((prev) => ({ ...prev, matterId }));
  }, []);

  const setFormData = useCallback((formData: ReviewFormData) => {
    setState((prev) => ({ ...prev, formData }));
  }, []);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  /**
   * Upload file to storage and create document record
   */
  const uploadFile = useCallback(
    async (file: File) => {
      setState((prev) => ({ ...prev, step: 2, status: "uploading", error: null }));

      try {
        // 1. Upload file to MinIO (firmId derived from session on server)
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || "Failed to upload file");
        }

        const uploadData = await uploadRes.json();
        const uploadId = uploadData.upload.id;

        setState((prev) => ({ ...prev, uploadId }));

        // 2. Create document record (without matterId initially)
        const docRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: file.name.replace(/\.pdf$/i, ""),
            type: "other",
            uploadId,
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            // matterId will be set later in step 4
          }),
        });

        if (!docRes.ok) {
          const err = await docRes.json().catch(() => ({ error: "Document creation failed" }));
          throw new Error(err.error || "Failed to create document");
        }

        const doc = await docRes.json();
        setState((prev) => ({ ...prev, documentId: doc.id }));

        // 3. Trigger analysis
        await analyzeDocument(doc.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState((prev) => ({ ...prev, status: "error", error: message }));
        options.onError?.(message);
      }
    },
    [options]
  );

  /**
   * Trigger AI analysis on uploaded document
   */
  const analyzeDocument = useCallback(
    async (documentId: string) => {
      setState((prev) => ({ ...prev, status: "analyzing" }));

      try {
        // Use sync mode for simplicity (async polling can be added later)
        const analyzeRes = await fetch(`/api/documents/${documentId}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });

        if (!analyzeRes.ok) {
          const err = await analyzeRes.json().catch(() => ({ error: "Analysis failed" }));
          throw new Error(err.error || "Failed to analyze document");
        }

        const result = await analyzeRes.json();
        const analysis: AnalysisResult = result.analysis;

        // Pre-fill form with AI suggestions
        const formData: ReviewFormData = {
          title: analysis.suggestedTitle,
          type: analysis.documentType,
          documentDate: analysis.documentDate || "",
          summary: analysis.summary,
        };

        setState((prev) => ({
          ...prev,
          step: 3,
          status: "complete",
          analysis,
          formData,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setState((prev) => ({ ...prev, status: "error", error: message }));
        options.onError?.(message);
      }
    },
    [options]
  );

  /**
   * Retry after error
   */
  const retry = useCallback(() => {
    if (state.file) {
      // Reset to step 1 to allow re-upload
      setState((prev) => ({
        ...prev,
        step: 1,
        status: "uploading",
        error: null,
        uploadId: null,
        documentId: null,
      }));
    }
  }, [state.file]);

  /**
   * Save final document with matter assignment
   */
  const saveDocument = useCallback(async () => {
    if (!state.documentId) return;

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const updateData: Record<string, unknown> = {
        title: state.formData.title,
        type: state.formData.type,
      };

      if (state.formData.documentDate) {
        updateData.documentDate = state.formData.documentDate;
      }

      if (state.matterId) {
        updateData.matterId = state.matterId;
      }

      const res = await fetch(`/api/documents/${state.documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Failed to save document");
      }

      options.onSuccess?.(state.documentId);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setState((prev) => ({ ...prev, error: message, isSubmitting: false }));
      options.onError?.(message);
    }
  }, [state.documentId, state.formData, state.matterId, options, reset]);

  return {
    ...state,
    setFile,
    setMatterId,
    setFormData,
    goToStep,
    uploadFile,
    retry,
    saveDocument,
    reset,
  };
}
