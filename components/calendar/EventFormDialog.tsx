"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/lib/hooks/use-toast";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Matter {
  id: string;
  name: string;
  reference: string;
}

interface MattersResponse {
  matters: Matter[];
}

interface CreateEventPayload {
  title: string;
  eventType: string;
  startAt: string;
  endAt?: string;
  allDay?: boolean;
  description?: string;
  location?: string;
  matterId?: string;
  priority?: string;
}

export function EventFormDialog({ open, onOpenChange }: EventFormDialogProps) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [matterId, setMatterId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mattersData } = useQuery({
    queryKey: ["matters"],
    queryFn: async (): Promise<MattersResponse> => {
      const res = await fetch("/api/matters?limit=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch matters");
      return res.json();
    },
    enabled: open,
  });

  const createEventMutation = useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create event");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast({
        title: "Event created",
        description: "Your calendar event has been created successfully.",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!allDay && !startTime) {
      newErrors.startTime = "Start time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const startAt = allDay ? `${startDate}T00:00:00Z` : `${startDate}T${startTime}:00Z`;

    const payload: CreateEventPayload = {
      title,
      eventType,
      startAt,
      allDay,
      priority,
    };

    if (endDate && (allDay || endTime)) {
      payload.endAt = allDay ? `${endDate}T23:59:59Z` : `${endDate}T${endTime}:00Z`;
    }

    if (description.trim()) {
      payload.description = description;
    }

    if (location.trim()) {
      payload.location = location;
    }

    if (matterId) {
      payload.matterId = matterId;
    }

    createEventMutation.mutate(payload);
  };

  const handleClose = () => {
    setTitle("");
    setEventType("meeting");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setAllDay(false);
    setDescription("");
    setLocation("");
    setMatterId("");
    setPriority("medium");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900/95 border-slate-800/50 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-amber-50">Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="bg-slate-800/50 border-slate-700/50 text-slate-100"
              maxLength={200}
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType" className="text-slate-300">
              Event Type <span className="text-red-400">*</span>
            </Label>
            <select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100"
            >
              <option value="hearing">Hearing</option>
              <option value="deadline">Deadline</option>
              <option value="meeting">Meeting</option>
              <option value="reminder">Reminder</option>
              <option value="limitation_date">Limitation Date</option>
              <option value="filing_deadline">Filing Deadline</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="allDay"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="allDay" className="text-slate-300 cursor-pointer">
              All day event
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-slate-300">
                Start Date <span className="text-red-400">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-slate-100"
              />
              {errors.startDate && <p className="text-sm text-red-400">{errors.startDate}</p>}
            </div>

            {!allDay && (
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-slate-300">
                  Start Time <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-100"
                />
                {errors.startTime && <p className="text-sm text-red-400">{errors.startTime}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-slate-300">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-slate-100"
              />
            </div>

            {!allDay && (
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-slate-300">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-100"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-slate-300">
              Priority
            </Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Description
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-slate-300">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location"
              className="bg-slate-800/50 border-slate-700/50 text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matterId" className="text-slate-300">
              Associated Matter
            </Label>
            <select
              id="matterId"
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100"
            >
              <option value="">None</option>
              {mattersData?.matters?.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {matter.reference} - {matter.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
