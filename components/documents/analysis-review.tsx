"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, User, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge, ConfidenceLevel } from "./confidence-badge";
import { cn } from "@/lib/utils";

export interface ExtractedParty {
  name: string;
  role: string;
}

export interface ExtractedDate {
  label: string;
  date: string;
}

export interface AnalysisResult {
  suggestedTitle: string;
  documentType: string;
  documentDate: string | null;
  parties: ExtractedParty[];
  keyDates: ExtractedDate[];
  summary: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

export interface ReviewFormData {
  title: string;
  type: string;
  documentDate: string;
  summary: string;
}

interface AnalysisReviewProps {
  analysis: AnalysisResult;
  formData: ReviewFormData;
  onFormChange: (data: ReviewFormData) => void;
  className?: string;
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

/**
 * Review and edit AI-extracted document metadata
 */
export function AnalysisReview({
  analysis,
  formData,
  onFormChange,
  className,
}: AnalysisReviewProps) {
  const [showSummary, setShowSummary] = useState(false);

  const handleChange = (field: keyof ReviewFormData, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Confidence Badge */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
        <div>
          <p className="text-sm font-medium text-slate-700">AI Confidence</p>
          <p className="text-xs text-slate-500">Based on document clarity and structure</p>
        </div>
        <ConfidenceBadge confidence={analysis.confidence} level={analysis.confidenceLevel} />
      </div>

      {/* Editable Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter document title"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentDate">Document Date</Label>
            <Input
              id="documentDate"
              type="date"
              value={formData.documentDate}
              onChange={(e) => handleChange("documentDate", e.target.value)}
            />
          </div>
        </div>

        {/* Collapsible Summary */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
            onClick={() => setShowSummary(!showSummary)}
          >
            <Label className="cursor-pointer">Summary</Label>
            {showSummary ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </Button>
          {showSummary && (
            <Textarea
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              rows={3}
              placeholder="Document summary"
            />
          )}
        </div>
      </div>

      {/* Read-only Extracted Data */}
      {analysis.parties.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Extracted Parties</p>
          <div className="space-y-2">
            {analysis.parties.map((party, index) => (
              <div key={index} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{party.name}</p>
                  <p className="text-xs text-slate-500">{party.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.keyDates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Key Dates</p>
          <div className="space-y-2">
            {analysis.keyDates.map((date, index) => (
              <div key={index} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{date.label}</p>
                  <p className="text-xs text-slate-500">{date.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
