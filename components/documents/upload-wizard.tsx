"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadDropzone } from "./upload-dropzone";
import { AnalysisProgress } from "./analysis-progress";
import { AnalysisReview } from "./analysis-review";
import { MatterAssign } from "./matter-assign";
import { useDocumentUpload } from "@/lib/hooks/use-document-upload";
import { cn } from "@/lib/utils";

interface DocumentUploadWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a matter (skips the matter assignment step) */
  defaultMatterId?: string;
  /** Called when document is successfully saved. Receives the new document ID. */
  onSuccess?: (documentId: string) => void;
}

const STEPS = [
  { number: 1, title: "Upload" },
  { number: 2, title: "Analyze" },
  { number: 3, title: "Review" },
  { number: 4, title: "Assign" },
] as const;

/**
 * 4-step wizard for document upload with AI analysis
 * When defaultMatterId is provided, step 4 (matter assignment) is skipped.
 */
export function DocumentUploadWizard({
  open,
  onOpenChange,
  defaultMatterId,
  onSuccess,
}: DocumentUploadWizardProps) {
  const queryClient = useQueryClient();

  const {
    step,
    file,
    analysis,
    formData,
    matterId,
    status,
    error,
    isSubmitting,
    hasDefaultMatter,
    setFile,
    setMatterId,
    setFormData,
    goToStep,
    uploadFile,
    retry,
    saveDocument,
    reset,
  } = useDocumentUpload({
    defaultMatterId,
    onSuccess: (documentId: string) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.(documentId);
      onOpenChange(false);
    },
  });

  // When matter is pre-selected, use 3-step flow
  const steps = hasDefaultMatter
    ? [
        { number: 1, title: "Upload" },
        { number: 2, title: "Analyze" },
        { number: 3, title: "Review" },
      ]
    : STEPS;

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleStartUpload = () => {
    if (file) {
      uploadFile(file);
    }
  };

  const handleSave = async () => {
    await saveDocument();
  };

  const canProceedFromStep1 = file !== null;
  const canProceedFromStep3 = formData.title.trim() !== "" && formData.type !== "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF and let AI extract the key information automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b pb-4">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  step > s.number
                    ? "bg-green-100 text-green-700"
                    : step === s.number
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                )}
              >
                {step > s.number ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span
                className={cn(
                  "ml-2 hidden text-sm sm:block",
                  step >= s.number ? "text-slate-900" : "text-slate-400"
                )}
              >
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-px w-8 sm:w-12",
                    step > s.number ? "bg-green-300" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {step === 1 && (
            <UploadDropzone
              selectedFile={file}
              onFileSelect={setFile}
              onClear={() => setFile(null)}
            />
          )}

          {step === 2 && <AnalysisProgress status={status} error={error} onRetry={retry} />}

          {step === 3 && analysis && (
            <AnalysisReview analysis={analysis} formData={formData} onFormChange={setFormData} />
          )}

          {step === 4 && !hasDefaultMatter && (
            <MatterAssign selectedMatterId={matterId} onSelect={setMatterId} />
          )}
        </div>

        {/* Error Display */}
        {error && step !== 2 && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            {step > 1 && step !== 2 && (
              <Button
                variant="ghost"
                onClick={() => goToStep((step - 1) as 1 | 2 | 3 | 4)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {step === 1 && (
              <Button onClick={handleStartUpload} disabled={!canProceedFromStep1}>
                Upload & Analyze
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 3 && !hasDefaultMatter && (
              <Button onClick={() => goToStep(4)} disabled={!canProceedFromStep3}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 3 && hasDefaultMatter && (
              <Button onClick={handleSave} disabled={!canProceedFromStep3 || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Document"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 4 && !hasDefaultMatter && (
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Document"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
