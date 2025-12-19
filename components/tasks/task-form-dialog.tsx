"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/lib/hooks/use-toast";
import { useFirmMembers } from "@/lib/hooks/use-firm-members";
import type { Task } from "./task-card";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matterId: string;
  task?: Task;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assigneeId: string;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assigneeId: "",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  matterId,
  task,
  onSuccess,
}: TaskFormDialogProps) {
  const isEditMode = Boolean(task);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const { data: firmMembersData, isLoading: membersLoading } = useFirmMembers();

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.slice(0, 16) : "",
          assigneeId: task.assigneeId || "",
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [open, task]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (formData.description.length > 10000) {
      newErrors.description = "Description must be 10,000 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/tasks/${task!.id}` : "/api/tasks";
      const method = isEditMode ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: formData.title.trim(),
        priority: formData.priority,
      };

      if (!isEditMode) {
        body.matterId = matterId;
      }

      if (formData.description.trim()) {
        body.description = formData.description.trim();
      } else if (isEditMode) {
        body.description = null;
      }

      if (formData.dueDate) {
        body.dueDate = new Date(formData.dueDate).toISOString();
      } else if (isEditMode) {
        body.dueDate = null;
      }

      if (formData.assigneeId) {
        body.assigneeId = formData.assigneeId;
      } else if (isEditMode) {
        body.assigneeId = null;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save task");
      }

      toast({
        title: isEditMode ? "Task updated" : "Task created",
        description: isEditMode
          ? "The task has been updated successfully."
          : "The task has been created successfully.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the task details below." : "Add a new task to this matter."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                maxLength={200}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description (optional)"
                rows={3}
                maxLength={10000}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: value as FormData["priority"],
                  }))
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            {/* Assignee */}
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigneeId: value === "unassigned" ? "" : value,
                  }))
                }
                disabled={membersLoading}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {firmMembersData?.members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
