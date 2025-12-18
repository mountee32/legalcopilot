"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/hooks/use-toast";
import type { CreateTaskSchema } from "@/lib/api/schemas/tasks";
import type { z } from "zod";

type CreateTask = z.infer<typeof CreateTaskSchema>;

interface Matter {
  id: string;
  reference: string;
  title: string;
  clientName?: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [isLoadingMatters, setIsLoadingMatters] = useState(true);
  const [formData, setFormData] = useState<Partial<CreateTask>>({
    matterId: "",
    title: "",
    description: "",
    priority: "medium",
    dueDate: undefined,
    assigneeId: undefined,
  });

  useEffect(() => {
    const fetchMatters = async () => {
      try {
        const res = await fetch("/api/matters?limit=100", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch matters");
        const data = await res.json();
        setMatters(data.matters || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load matters",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMatters(false);
      }
    };

    fetchMatters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.matterId || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Matter and title are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateTask = {
        matterId: formData.matterId,
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        dueDate: formData.dueDate || undefined,
        assigneeId: formData.assigneeId || undefined,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create task");
      }

      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
      router.push("/tasks");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateTask, value: string | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <h1 className="text-3xl font-bold">New Task</h1>
          <p className="text-muted-foreground mt-1">Create a new task for a matter</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>Enter the task information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Matter Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="matterId">Matter *</Label>
                <select
                  id="matterId"
                  value={formData.matterId}
                  onChange={(e) => handleChange("matterId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={isLoadingMatters}
                >
                  <option value="">
                    {isLoadingMatters ? "Loading matters..." : "Select a matter..."}
                  </option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.reference} - {matter.title}
                      {matter.clientName ? ` (${matter.clientName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task description..."
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  maxLength={10000}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate || ""}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/tasks")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingMatters}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
