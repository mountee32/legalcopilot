"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCategoryFormProps {
  packId: string;
  onSave: (category: { key: string; label: string; description?: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function AddCategoryForm({ packId, onSave, onCancel, isSaving }: AddCategoryFormProps) {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  const handleLabelChange = (value: string) => {
    setLabel(value);
    if (!keyManuallyEdited) {
      setKey(slugify(value));
    }
  };

  const handleSubmit = () => {
    if (!label.trim() || !key.trim()) return;
    onSave({
      key: key.trim(),
      label: label.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="p-4 bg-slate-800/40 rounded-lg border border-amber-800/30 space-y-3">
      <h4 className="text-xs font-medium text-amber-200 uppercase tracking-wider">New Category</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Label</label>
          <Input
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Medical Evidence"
            className="h-8 bg-slate-900/50 border-slate-700/50 text-amber-50 text-sm"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Key (auto-generated)</label>
          <Input
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setKeyManuallyEdited(true);
            }}
            placeholder="medical_evidence"
            className="h-8 bg-slate-900/50 border-slate-700/50 text-amber-50 text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 block mb-1">Description (optional)</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this category"
          className="h-8 bg-slate-900/50 border-slate-700/50 text-amber-50 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-slate-700/50 text-slate-400"
          onClick={onCancel}
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 border border-amber-800/30"
          onClick={handleSubmit}
          disabled={!label.trim() || !key.trim() || isSaving}
        >
          <Plus className="h-3 w-3 mr-1" />
          {isSaving ? "Adding..." : "Add Category"}
        </Button>
      </div>
    </div>
  );
}
