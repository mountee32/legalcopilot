"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Mail, Eye, Download, Sparkles, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  type: "document" | "email";
  category: string | null;
  content: string;
  isActive: boolean;
  version: number;
  firmId: string | null;
}

interface TemplateResponse {
  templates: Template[];
}

async function fetchTemplates(type?: string): Promise<TemplateResponse> {
  const params = new URLSearchParams({ activeOnly: "true" });
  if (type) params.append("type", type);

  const res = await fetch(`/api/templates?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "document" | "email">("all");
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["templates", selectedType === "all" ? undefined : selectedType],
    queryFn: () => fetchTemplates(selectedType === "all" ? undefined : selectedType),
    staleTime: 120_000,
  });

  const templates = data?.templates || [];

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce(
    (acc, template) => {
      const category = template.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    },
    {} as Record<string, Template[]>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              Templates
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Document Library
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/40 border-slate-800/50 text-slate-300 placeholder:text-slate-500 focus:border-amber-800/50"
            />
          </div>

          <Tabs
            value={selectedType}
            onValueChange={(v) => setSelectedType(v as typeof selectedType)}
            className="shrink-0"
          >
            <TabsList className="bg-slate-900/50 border border-slate-800/50">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="document"
                className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Emails
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-slate-800/30" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-serif text-slate-300 mb-2">
              {searchQuery ? "No templates found" : "No templates yet"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Create your first template to get started"}
            </p>
            {!searchQuery && (
              <Button className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTemplates)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, categoryTemplates]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-serif text-amber-50">{category}</h2>
                    <span className="text-xs font-mono text-slate-500 tracking-wider">
                      {categoryTemplates.length}{" "}
                      {categoryTemplates.length === 1 ? "template" : "templates"}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm hover:bg-slate-800/40 transition-all cursor-pointer group overflow-hidden"
                      >
                        <div className="p-6">
                          {/* Template Icon */}
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className={`p-3 rounded-lg ${
                                template.type === "document"
                                  ? "bg-blue-900/20 text-blue-400"
                                  : "bg-purple-900/20 text-purple-400"
                              }`}
                            >
                              {template.type === "document" ? (
                                <FileText className="h-6 w-6" />
                              ) : (
                                <Mail className="h-6 w-6" />
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
                            >
                              v{template.version}
                            </Badge>
                          </div>

                          {/* Template Name */}
                          <h3 className="font-serif text-base text-amber-50 mb-2 group-hover:text-amber-200 transition-colors line-clamp-2">
                            {template.name}
                          </h3>

                          {/* Preview */}
                          <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                            {template.content.substring(0, 150)}...
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1.5" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1.5" />
                              Generate
                            </Button>
                          </div>

                          {/* Firm vs System badge */}
                          {!template.firmId && (
                            <div className="mt-3 pt-3 border-t border-slate-800/50">
                              <Badge
                                variant="outline"
                                className="bg-emerald-900/20 border-emerald-900/30 text-emerald-100 text-xs"
                              >
                                System Template
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* AI Template Assistance */}
        <Card className="mt-8 bg-gradient-to-br from-amber-950/20 to-amber-900/10 border-amber-800/30 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-900/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg text-amber-50 mb-2">AI Template Assistant</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  Let AI help you create custom templates based on your practice needs. Describe
                  what you need and we'll draft a professional template for your review.
                </p>
                <Button
                  variant="outline"
                  className="border-amber-800/30 bg-amber-900/20 hover:bg-amber-900/40 text-amber-100"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Propose New Template
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
