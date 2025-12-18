"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  TrendingUp,
  Phone,
  Mail,
  Building,
  User,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface Lead {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  enquiryType: string | null;
  message: string | null;
  source: string | null;
  status: string;
  score: number | null;
  createdAt: string;
  convertedToClientId: string | null;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-purple-100 text-purple-700 border-purple-200",
  qualified: "bg-amber-100 text-amber-700 border-amber-200",
  won: "bg-emerald-100 text-emerald-700 border-emerald-200",
  lost: "bg-red-100 text-red-700 border-red-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
};

const scoreRanges = [
  { min: 0, max: 30, label: "Cold", color: "text-slate-500", icon: "❄️" },
  { min: 31, max: 60, label: "Warm", color: "text-amber-600", icon: "🔥" },
  { min: 61, max: 100, label: "Hot", color: "text-red-600", icon: "🔥🔥" },
];

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/leads?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch leads");

      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreInfo = (score: number | null) => {
    if (score === null) return scoreRanges[0];
    return scoreRanges.find((range) => score >= range.min && score <= range.max) || scoreRanges[0];
  };

  const getLeadName = (lead: Lead) => {
    if (lead.companyName) return lead.companyName;
    if (lead.firstName || lead.lastName) {
      return `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
    }
    return lead.email || "Unknown";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const statusCounts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Leads</h1>
              <p className="text-slate-600 text-lg">
                Track enquiries and convert prospects to clients
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchLeads} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => router.push("/leads/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                New Lead
              </Button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-3 font-medium transition-all relative whitespace-nowrap ${
                statusFilter === null ? "text-amber-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Leads
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-full">
                {statusCounts.all}
              </span>
              {statusFilter === null && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
              )}
            </button>
            {["new", "contacted", "qualified"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 font-medium transition-all relative whitespace-nowrap capitalize ${
                  statusFilter === status ? "text-amber-600" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {status}
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-full">
                  {statusCounts[status as keyof typeof statusCounts]}
                </span>
                {statusFilter === status && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </>
          ) : leads.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No leads found</h3>
              <p className="text-slate-600 mb-4">
                {statusFilter
                  ? `No ${statusFilter} leads to display.`
                  : "Start adding leads to track your enquiries."}
              </p>
              <Button onClick={() => router.push("/leads/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Lead
              </Button>
            </Card>
          ) : (
            leads.map((lead) => {
              const scoreInfo = getScoreInfo(lead.score);
              const leadName = getLeadName(lead);

              return (
                <Card
                  key={lead.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-l-4 border-l-amber-500"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {lead.companyName ? (
                            <Building className="h-5 w-5 text-slate-400" />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {leadName}
                          </h3>
                          <span className="text-sm text-slate-500">
                            {formatDate(lead.createdAt)}
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          {lead.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Message Preview */}
                        {lead.message && (
                          <p className="text-sm text-slate-700 line-clamp-2 mb-3">{lead.message}</p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={statusColors[lead.status] || ""}>
                            {lead.status}
                          </Badge>
                          {lead.enquiryType && (
                            <Badge variant="outline" className="capitalize">
                              {lead.enquiryType.replace("_", " ")}
                            </Badge>
                          )}
                          {lead.source && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {lead.source}
                            </Badge>
                          )}
                          {lead.score !== null && (
                            <Badge
                              variant="outline"
                              className={`font-bold ${
                                lead.score >= 61
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : lead.score >= 31
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {scoreInfo.icon} {scoreInfo.label} ({lead.score})
                            </Badge>
                          )}
                          {lead.convertedToClientId && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              Converted
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pipeline Summary */}
        {!isLoading && leads.length > 0 && (
          <Card className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Pipeline Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.new}</div>
                  <div className="text-sm text-slate-600">New Enquiries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.contacted}</div>
                  <div className="text-sm text-slate-600">Contacted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.qualified}</div>
                  <div className="text-sm text-slate-600">Qualified</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {leads.filter((l) => l.convertedToClientId).length}
                  </div>
                  <div className="text-sm text-slate-600">Converted</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
