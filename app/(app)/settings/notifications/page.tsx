"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/lib/hooks/use-toast";

interface NotificationPreferences {
  channelsByType?: Record<string, ("in_app" | "email" | "push")[]>;
}

interface PreferencesResponse {
  preferences: NotificationPreferences;
  updatedAt: string;
}

export default function NotificationPreferencesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>({});

  const { isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const data = (await res.json()) as PreferencesResponse;
      setPreferences(data.preferences);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const notificationTypes = [
    { value: "task_assigned", label: "Task assigned to me" },
    { value: "task_due", label: "Task due soon" },
    { value: "task_overdue", label: "Task overdue" },
    { value: "approval_required", label: "Approval required" },
    { value: "deadline_approaching", label: "Deadline approaching" },
    { value: "email_received", label: "New email received" },
    { value: "document_uploaded", label: "Document uploaded" },
    { value: "invoice_paid", label: "Invoice paid" },
    { value: "payment_received", label: "Payment received" },
  ];

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return <div className="p-6">Loading preferences...</div>;
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Choose how you want to be notified about different events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Select which notifications you want to receive and how you want to receive them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((type) => (
            <div key={type.value} className="space-y-2">
              <Label className="text-base font-medium">{type.label}</Label>
              <div className="flex gap-6 ml-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${type.value}-in_app`}
                    checked={preferences.channelsByType?.[type.value]?.includes("in_app") ?? true}
                    onCheckedChange={(checked) => {
                      const current = preferences.channelsByType?.[type.value] ?? ["in_app"];
                      const updated = checked
                        ? [...current, "in_app"]
                        : current.filter((c) => c !== "in_app");
                      setPreferences({
                        ...preferences,
                        channelsByType: {
                          ...preferences.channelsByType,
                          [type.value]: updated,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={`${type.value}-in_app`} className="text-sm font-normal">
                    In-app
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${type.value}-email`}
                    checked={preferences.channelsByType?.[type.value]?.includes("email") ?? false}
                    onCheckedChange={(checked) => {
                      const current = preferences.channelsByType?.[type.value] ?? ["in_app"];
                      const updated = checked
                        ? [...current, "email"]
                        : current.filter((c) => c !== "email");
                      setPreferences({
                        ...preferences,
                        channelsByType: {
                          ...preferences.channelsByType,
                          [type.value]: updated,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={`${type.value}-email`} className="text-sm font-normal">
                    Email
                  </Label>
                </div>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
