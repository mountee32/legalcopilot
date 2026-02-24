"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DropZoneProps {
  matterId: string;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export function DropZone({ matterId, onUploadComplete, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) uploadDocument(file);
    },
    [disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && !disabled) uploadDocument(file);
    },
    [disabled]
  );

  async function uploadDocument(file: File) {
    setUploadFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("matterId", matterId);
      formData.append("title", file.name);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      onUploadComplete?.();
    } catch {
      // Error handled by caller via toast
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  }

  return (
    <Card
      className={`relative border-2 border-dashed p-6 transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : disabled
            ? "border-slate-200 bg-slate-50 opacity-60"
            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-600">Uploading {uploadFile?.name}...</p>
            <p className="text-xs text-slate-400">Pipeline will start automatically</p>
          </>
        ) : (
          <>
            <Upload className={`h-8 w-8 ${isDragging ? "text-blue-500" : "text-slate-400"}`} />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Drop a document here to start the AI pipeline
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT, or images supported</p>
            </div>
            <label>
              <Button variant="outline" size="sm" asChild disabled={disabled}>
                <span>
                  <FileText className="w-4 h-4 mr-2" />
                  Browse files
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.tiff,.tif"
                onChange={handleFileSelect}
                disabled={disabled}
              />
            </label>
          </>
        )}
      </div>
    </Card>
  );
}
