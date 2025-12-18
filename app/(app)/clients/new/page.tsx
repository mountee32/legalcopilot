"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/hooks/use-toast";
import type { CreateClient } from "@/lib/api/schemas/clients";

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateClient>({
    type: "individual",
    email: "",
    country: "United Kingdom",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create client");
      }

      const client = await res.json();
      toast({
        title: "Client created",
        description: "The client has been created successfully.",
      });
      router.push(`/clients/${client.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateClient, value: string | undefined) => {
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/clients")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <h1 className="text-3xl font-bold">New Client</h1>
          <p className="text-muted-foreground mt-1">Add a new client to your directory</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
              <CardDescription>Enter the client information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Client Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value as CreateClient["type"])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="trust">Trust</option>
                  <option value="estate">Estate</option>
                  <option value="charity">Charity</option>
                  <option value="government">Government</option>
                </select>
              </div>

              {/* Individual Fields */}
              {formData.type === "individual" && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Mr, Mrs, Ms, etc."
                        value={formData.title || ""}
                        onChange={(e) => handleChange("title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName || ""}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={formData.lastName || ""}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Company Fields */}
              {formData.type === "company" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Ltd"
                      value={formData.companyName || ""}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyNumber">Company Number</Label>
                    <Input
                      id="companyNumber"
                      placeholder="12345678"
                      value={formData.companyNumber || ""}
                      onChange={(e) => handleChange("companyNumber", e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Non-individual, non-company types */}
              {["trust", "estate", "charity", "government"].includes(formData.type) && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Name *</Label>
                  <Input
                    id="companyName"
                    placeholder={`${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} name`}
                    value={formData.companyName || ""}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="020 1234 5678"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="07123 456789"
                      value={formData.mobile || ""}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-semibold">Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    placeholder="123 High Street"
                    value={formData.addressLine1 || ""}
                    onChange={(e) => handleChange("addressLine1", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment 4B"
                    value={formData.addressLine2 || ""}
                    onChange={(e) => handleChange("addressLine2", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="London"
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      placeholder="Greater London"
                      value={formData.county || ""}
                      onChange={(e) => handleChange("county", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder="SW1A 1AA"
                    value={formData.postcode || ""}
                    onChange={(e) => handleChange("postcode", e.target.value)}
                  />
                </div>
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  value={formData.source || ""}
                  onChange={(e) => handleChange("source", e.target.value || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select source...</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="lead_conversion">Lead Conversion</option>
                  <option value="existing_client">Existing Client</option>
                  <option value="partner_firm">Partner Firm</option>
                  <option value="marketing">Marketing</option>
                  <option value="social_media">Social Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information about this client..."
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
              onClick={() => router.push("/clients")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
