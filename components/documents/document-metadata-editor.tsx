"use client";

import { useState } from "react";
import { Plus, Trash2, User, Calendar } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface ExtractedParty {
  name: string;
  role: string;
}

export interface ExtractedDate {
  label: string;
  date: string;
}

export interface DocumentMetadata {
  title: string;
  type: string;
  documentDate: string;
  aiSummary: string;
  extractedParties: ExtractedParty[];
  extractedDates: ExtractedDate[];
}

interface DocumentMetadataEditorProps {
  data: DocumentMetadata;
  onChange: (data: DocumentMetadata) => void;
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
 * Edit document metadata including AI-extracted parties and dates
 */
export function DocumentMetadataEditor({ data, onChange, className }: DocumentMetadataEditorProps) {
  const handleChange = <K extends keyof DocumentMetadata>(field: K, value: DocumentMetadata[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Party management
  const addParty = () => {
    handleChange("extractedParties", [...data.extractedParties, { name: "", role: "" }]);
  };

  const updateParty = (index: number, field: keyof ExtractedParty, value: string) => {
    const updated = [...data.extractedParties];
    updated[index] = { ...updated[index], [field]: value };
    handleChange("extractedParties", updated);
  };

  const removeParty = (index: number) => {
    handleChange(
      "extractedParties",
      data.extractedParties.filter((_, i) => i !== index)
    );
  };

  // Date management
  const addDate = () => {
    handleChange("extractedDates", [...data.extractedDates, { label: "", date: "" }]);
  };

  const updateDate = (index: number, field: keyof ExtractedDate, value: string) => {
    const updated = [...data.extractedDates];
    updated[index] = { ...updated[index], [field]: value };
    handleChange("extractedDates", updated);
  };

  const removeDate = (index: number) => {
    handleChange(
      "extractedDates",
      data.extractedDates.filter((_, i) => i !== index)
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Basic Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter document title"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select value={data.type} onValueChange={(value) => handleChange("type", value)}>
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
              value={data.documentDate}
              onChange={(e) => handleChange("documentDate", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={data.aiSummary}
            onChange={(e) => handleChange("aiSummary", e.target.value)}
            rows={3}
            placeholder="Document summary"
          />
        </div>
      </div>

      {/* Editable Parties */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">Extracted Parties</Label>
          <Button type="button" variant="outline" size="sm" onClick={addParty} className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Party
          </Button>
        </div>
        {data.extractedParties.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No parties extracted</p>
        ) : (
          <div className="space-y-2">
            {data.extractedParties.map((party, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
              >
                <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Input
                  value={party.name}
                  onChange={(e) => updateParty(index, "name", e.target.value)}
                  placeholder="Name"
                  className="h-8 flex-1"
                />
                <Input
                  value={party.role}
                  onChange={(e) => updateParty(index, "role", e.target.value)}
                  placeholder="Role"
                  className="h-8 w-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParty(index)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editable Dates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">Key Dates</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDate} className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Date
          </Button>
        </div>
        {data.extractedDates.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No dates extracted</p>
        ) : (
          <div className="space-y-2">
            {data.extractedDates.map((date, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
              >
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Input
                  value={date.label}
                  onChange={(e) => updateDate(index, "label", e.target.value)}
                  placeholder="Label (e.g., Signing Date)"
                  className="h-8 flex-1"
                />
                <Input
                  type="date"
                  value={date.date}
                  onChange={(e) => updateDate(index, "date", e.target.value)}
                  className="h-8 w-40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDate(index)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
