"use client";

import { useState } from "react";
import { GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ForkDialogProps {
  packId: string;
  packName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForked: (newPackId: string) => void;
}

export function ForkDialog({ packId, packName, open, onOpenChange, onForked }: ForkDialogProps) {
  const [customName, setCustomName] = useState("");
  const [isForking, setIsForking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveName = customName.trim() || `${packName} (Firm Copy)`;

  const handleFork = async () => {
    setIsForking(true);
    setError(null);

    try {
      const res = await fetch(`/api/taxonomy/packs/${packId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: effectiveName }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fork pack");
      }

      const data = await res.json();
      onForked(data.pack.id);
      onOpenChange(false);
      setCustomName("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsForking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-amber-50">
        <DialogHeader>
          <DialogTitle className="font-serif text-amber-50">Customize Pack</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create an editable copy of &ldquo;{packName}&rdquo; for your firm. All categories,
            fields, document types, triggers, and rules will be copied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Pack name (optional)</label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`${packName} (Firm Copy)`}
              className="bg-slate-800/50 border-slate-700/50 text-amber-50 placeholder:text-slate-600"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700/50 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFork}
            disabled={isForking}
            className="bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 border border-amber-800/30"
          >
            <GitFork className="h-4 w-4 mr-2" />
            {isForking ? "Creating copy..." : "Create Firm Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
