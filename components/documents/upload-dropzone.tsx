"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Drag-and-drop file upload zone
 */
export function UploadDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  accept = ".pdf",
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  className,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`;
      }
      if (
        accept &&
        !accept.split(",").some((ext) => file.name.toLowerCase().endsWith(ext.trim()))
      ) {
        return `Invalid file type. Accepted: ${accept}`;
      }
      return null;
    },
    [accept, maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  if (selectedFile) {
    return (
      <div className={cn("rounded-lg border-2 border-dashed border-slate-200 p-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={disabled}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className={cn("cursor-pointer", disabled && "cursor-not-allowed")}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Upload className="h-6 w-6 text-slate-400" />
        </div>
        <p className="mb-1 text-sm font-medium text-slate-700">
          Drop your PDF here, or <span className="text-blue-600 hover:text-blue-700">browse</span>
        </p>
        <p className="text-xs text-slate-500">
          PDF files only, up to {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
