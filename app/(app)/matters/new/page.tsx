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
import type { CreateMatter } from "@/lib/api/schemas/matters";

type Client = {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  type: string;
};

export default function NewMatterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [formData, setFormData] = useState<CreateMatter>({
    title: "",
    clientId: "",
    practiceArea: "conveyancing",
    billingType: "hourly",
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients?limit=100", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch clients");
        }

        const data = await res.json();
        setClients(data.clients || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive",
        });
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create matter");
      }

      const matter = await res.json();
      toast({
        title: "Case created",
        description: "The case has been created successfully.",
      });
      router.push(`/matters/${matter.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateMatter, value: string | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const getClientDisplayName = (client: Client) => {
    if (client.type === "individual") {
      return `${client.firstName} ${client.lastName}`;
    }
    return client.companyName || "Unnamed Client";
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/matters")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
          <h1 className="text-3xl font-bold">New Case</h1>
          <p className="text-muted-foreground mt-1">Create a new case/matter for a client</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
              <CardDescription>Enter the case information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => handleChange("clientId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={isLoadingClients}
                >
                  <option value="">
                    {isLoadingClients ? "Loading clients..." : "Select a client..."}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientDisplayName(client)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Property Purchase - 123 High Street"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              {/* Practice Area */}
              <div className="space-y-2">
                <Label htmlFor="practiceArea">Practice Area *</Label>
                <select
                  id="practiceArea"
                  value={formData.practiceArea}
                  onChange={(e) => handleChange("practiceArea", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="conveyancing">Conveyancing</option>
                  <option value="litigation">Litigation</option>
                  <option value="family">Family</option>
                  <option value="probate">Probate</option>
                  <option value="employment">Employment</option>
                  <option value="immigration">Immigration</option>
                  <option value="personal_injury">Personal Injury</option>
                  <option value="commercial">Commercial</option>
                  <option value="criminal">Criminal</option>
                  <option value="ip">IP</option>
                  <option value="insolvency">Insolvency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Billing Type */}
              <div className="space-y-2">
                <Label htmlFor="billingType">Billing Type *</Label>
                <select
                  id="billingType"
                  value={formData.billingType}
                  onChange={(e) => handleChange("billingType", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed_fee">Fixed Fee</option>
                  <option value="conditional">Conditional</option>
                  <option value="legal_aid">Legal Aid</option>
                  <option value="pro_bono">Pro Bono</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the matter..."
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Financial Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold">Financial Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      placeholder="150.00"
                      value={formData.hourlyRate || ""}
                      onChange={(e) => handleChange("hourlyRate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fixedFee">Fixed Fee</Label>
                    <Input
                      id="fixedFee"
                      placeholder="5000.00"
                      value={formData.fixedFee || ""}
                      onChange={(e) => handleChange("fixedFee", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Estimated Value</Label>
                    <Input
                      id="estimatedValue"
                      placeholder="10000.00"
                      value={formData.estimatedValue || ""}
                      onChange={(e) => handleChange("estimatedValue", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Key Deadline */}
              <div className="space-y-2">
                <Label htmlFor="keyDeadline">Key Deadline</Label>
                <Input
                  id="keyDeadline"
                  type="datetime-local"
                  value={formData.keyDeadline || ""}
                  onChange={(e) => handleChange("keyDeadline", e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this case..."
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/matters")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
