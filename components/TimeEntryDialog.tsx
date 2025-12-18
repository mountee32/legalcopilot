"use client";

import * as React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/lib/hooks/use-toast";

interface Matter {
  id: string;
  title: string;
  matterNumber: string;
}

interface TimeEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TimeEntryDialog({ isOpen, onOpenChange, onSuccess }: TimeEntryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [mattersLoading, setMattersLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [matterId, setMatterId] = useState<string>("");
  const [workDate, setWorkDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("60");
  const [hourlyRate, setHourlyRate] = useState<string>("250.00");
  const [isBillable, setIsBillable] = useState<boolean>(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch matters when dialog opens
  React.useEffect(() => {
    if (isOpen && matters.length === 0) {
      setMattersLoading(true);
      fetch("/api/matters?limit=100", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setMatters(data.matters || []);
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to load matters",
            variant: "destructive",
          });
        })
        .finally(() => {
          setMattersLoading(false);
        });
    }
  }, [isOpen, matters.length, toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!matterId) {
      newErrors.matterId = "Matter is required";
    }
    if (!workDate) {
      newErrors.workDate = "Work date is required";
    }
    if (!description || description.length < 1) {
      newErrors.description = "Description is required";
    }
    if (description && description.length > 5000) {
      newErrors.description = "Description must be less than 5000 characters";
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration < 6 || duration > 1440) {
      newErrors.durationMinutes = "Duration must be between 6 and 1440 minutes";
    } else if (duration % 6 !== 0) {
      newErrors.durationMinutes = "Duration must be in 6-minute increments";
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      newErrors.hourlyRate = "Hourly rate must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterId,
          workDate,
          description,
          durationMinutes: parseInt(durationMinutes, 10),
          hourlyRate,
          isBillable,
          source: "manual",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create time entry");
      }

      toast({
        title: "Success",
        description: "Time entry created successfully",
      });

      // Reset form
      setMatterId("");
      setWorkDate(format(new Date(), "yyyy-MM-dd"));
      setDescription("");
      setDurationMinutes("60");
      setHourlyRate("250.00");
      setIsBillable(true);
      setErrors({});

      // Invalidate queries and call success callback
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create time entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = (minutes / 60).toFixed(1);
    return `${hours}h (${minutes} minutes)`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-50">
            <Clock className="h-5 w-5" />
            Record Time Entry
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new time entry for billing. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Matter Selection */}
          <div className="space-y-2">
            <Label htmlFor="matterId" className="text-slate-200">
              Matter *
            </Label>
            <Select value={matterId} onValueChange={setMatterId} disabled={mattersLoading}>
              <SelectTrigger
                id="matterId"
                className={`bg-slate-800 border-slate-700 text-slate-100 ${errors.matterId ? "border-red-500" : ""}`}
              >
                <SelectValue
                  placeholder={mattersLoading ? "Loading matters..." : "Select a matter"}
                />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {matters.map((matter) => (
                  <SelectItem key={matter.id} value={matter.id} className="text-slate-100">
                    {matter.matterNumber} - {matter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.matterId && <p className="text-sm text-red-400">{errors.matterId}</p>}
          </div>

          {/* Work Date */}
          <div className="space-y-2">
            <Label htmlFor="workDate" className="text-slate-200">
              Work Date *
            </Label>
            <Input
              id="workDate"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className={`bg-slate-800 border-slate-700 text-slate-100 ${errors.workDate ? "border-red-500" : ""}`}
            />
            {errors.workDate && <p className="text-sm text-red-400">{errors.workDate}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">
              Description *{" "}
              <span className="text-slate-500 font-normal">({description.length}/5000)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work performed..."
              rows={4}
              className={`bg-slate-800 border-slate-700 text-slate-100 ${errors.description ? "border-red-500" : ""}`}
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
          </div>

          {/* Duration and Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes" className="text-slate-200">
                Duration (minutes) *
              </Label>
              <Input
                id="durationMinutes"
                type="number"
                min="6"
                max="1440"
                step="6"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className={`bg-slate-800 border-slate-700 text-slate-100 ${errors.durationMinutes ? "border-red-500" : ""}`}
              />
              {!errors.durationMinutes && durationMinutes && (
                <p className="text-xs text-slate-400">
                  {formatDuration(parseInt(durationMinutes, 10) || 0)}
                </p>
              )}
              {errors.durationMinutes && (
                <p className="text-sm text-red-400">{errors.durationMinutes}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate" className="text-slate-200">
                Hourly Rate (GBP) *
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className={`bg-slate-800 border-slate-700 text-slate-100 ${errors.hourlyRate ? "border-red-500" : ""}`}
              />
              {errors.hourlyRate && <p className="text-sm text-red-400">{errors.hourlyRate}</p>}
            </div>
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBillable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked === true)}
              className="border-slate-700"
            />
            <Label htmlFor="isBillable" className="text-slate-200 font-normal cursor-pointer">
              Billable time entry
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-amber-900/40 hover:bg-amber-900/60 text-amber-50 border border-amber-800/30"
            >
              {isLoading ? "Creating..." : "Create Time Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
