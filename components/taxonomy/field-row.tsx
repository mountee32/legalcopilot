"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaxonomyField {
  id: string;
  key: string;
  label: string;
  dataType: string;
  confidenceThreshold: string;
  requiresHumanReview: boolean;
  sortOrder: number;
}

interface FieldRowProps {
  field: TaxonomyField;
  isEditable: boolean;
  onSave?: (
    fieldId: string,
    updates: { label?: string; confidenceThreshold?: string; requiresHumanReview?: boolean }
  ) => void;
  onDelete?: (fieldId: string) => void;
  isSaving?: boolean;
}

const DATA_TYPE_COLORS: Record<string, string> = {
  text: "bg-slate-700/30 text-slate-300",
  number: "bg-blue-900/20 text-blue-300",
  date: "bg-purple-900/20 text-purple-300",
  currency: "bg-green-900/20 text-green-300",
  boolean: "bg-orange-900/20 text-orange-300",
  enum: "bg-cyan-900/20 text-cyan-300",
  array: "bg-pink-900/20 text-pink-300",
};

export function FieldRow({ field, isEditable, onSave, onDelete, isSaving }: FieldRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(field.label);
  const [editThreshold, setEditThreshold] = useState(
    Math.round(parseFloat(field.confidenceThreshold) * 100)
  );
  const [editHumanReview, setEditHumanReview] = useState(field.requiresHumanReview);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confidence = parseFloat(field.confidenceThreshold);
  const pct = Math.round(confidence * 100);

  const handleSave = () => {
    onSave?.(field.id, {
      label: editLabel !== field.label ? editLabel : undefined,
      confidenceThreshold: editThreshold !== pct ? (editThreshold / 100).toFixed(3) : undefined,
      requiresHumanReview:
        editHumanReview !== field.requiresHumanReview ? editHumanReview : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(field.label);
    setEditThreshold(pct);
    setEditHumanReview(field.requiresHumanReview);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete?.(field.id);
    setShowDeleteConfirm(false);
  };

  if (isEditing && isEditable) {
    return (
      <div className="p-3 bg-slate-800/40 rounded-lg border border-amber-800/30 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="h-8 bg-slate-900/50 border-slate-700/50 text-amber-50 text-sm"
            placeholder="Field label"
          />
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${DATA_TYPE_COLORS[field.dataType] || DATA_TYPE_COLORS.text}`}
          >
            {field.dataType}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 block mb-1">
              Confidence threshold: {editThreshold}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={editThreshold}
              onChange={(e) => setEditThreshold(parseInt(e.target.value))}
              className="w-full h-1.5 accent-amber-500"
            />
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={editHumanReview}
              onChange={(e) => setEditHumanReview(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 accent-amber-500"
            />
            <span className="text-[10px] text-slate-400">Human review</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-slate-700/50 text-slate-400"
            onClick={handleCancel}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 border border-amber-800/30"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-3 w-3 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-amber-50/90">{field.label}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${DATA_TYPE_COLORS[field.dataType] || DATA_TYPE_COLORS.text}`}
          >
            {field.dataType}
          </Badge>
          {field.requiresHumanReview && (
            <Eye className="h-3 w-3 text-amber-500/60" title="Requires human review" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-16 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 90 ? "bg-green-500/60" : pct >= 70 ? "bg-yellow-500/60" : "bg-red-500/60"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{pct}%</span>
          <span className="text-[10px] text-slate-600 font-mono">{field.key}</span>
        </div>
      </div>

      {isEditable && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-400 hover:text-amber-200"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-400 hover:text-red-300"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-slate-400"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
