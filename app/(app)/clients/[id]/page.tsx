"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import type { Client } from "@/lib/api/schemas/clients";

interface Matter {
  id: string;
  reference: string;
  title: string;
  status: string;
  practiceArea: string;
  openedAt: string | null;
}

async function fetchClient(id: string): Promise<Client> {
  const res = await fetch(`/api/clients/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch client");
  return res.json();
}

async function fetchClientMatters(clientId: string): Promise<Matter[]> {
  const res = await fetch(`/api/matters?clientId=${clientId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch matters");
  const data = await res.json();
  return data.matters || [];
}

function StatusIndicator({ status }: { status: string }) {
  const config = {
    active: { color: "bg-emerald-500", label: "Active" },
    prospect: { color: "bg-amber-500", label: "Prospect" },
    dormant: { color: "bg-slate-400", label: "Dormant" },
    archived: { color: "bg-slate-300", label: "Archived" },
  };
  const { color, label } = config[status as keyof typeof config] || config.active;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm font-medium tracking-tight">{label}</span>
    </div>
  );
}

function MatterCard({ matter }: { matter: Matter }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/matters/${matter.id}`)}
      className="group p-4 border border-slate-200 hover:border-slate-300 rounded-lg transition-all cursor-pointer hover:shadow-sm"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500">{matter.reference}</span>
            <Badge variant="secondary" className="text-xs">
              {matter.practiceArea.replace("_", " ")}
            </Badge>
          </div>
          <h4 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
            {matter.title}
          </h4>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {matter.openedAt && (
        <p className="text-xs text-slate-500">
          Opened {format(new Date(matter.openedAt), "d MMM yyyy")}
        </p>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId),
    staleTime: 60_000,
  });

  const { data: matters = [], isLoading: mattersLoading } = useQuery({
    queryKey: ["client-matters", clientId],
    queryFn: () => fetchClientMatters(clientId),
    enabled: !!client,
    staleTime: 60_000,
  });

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md">
          <EmptyState
            title="Client not found"
            description="The client you're looking for doesn't exist or you don't have access."
            action={<Button onClick={() => router.push("/clients")}>Back to Clients</Button>}
          />
        </Card>
      </div>
    );
  }

  const displayName =
    client.type === "individual"
      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
      : client.companyName || "Unnamed Client";

  const activeMatters = matters.filter((m) => m.status === "active");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <button
            onClick={() => router.push("/clients")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Clients
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                {displayName}
              </h1>
              <div className="flex items-center gap-4">
                <StatusIndicator status={client.status} />
                <span className="text-sm text-slate-500">
                  {client.type === "individual"
                    ? "Individual"
                    : client.type.charAt(0).toUpperCase() + client.type.slice(1)}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Contact
              </h3>
              <div className="space-y-4">
                {client.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm text-slate-700 hover:text-slate-900 break-words"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {(client.phone || client.mobile) && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700">
                      {client.phone && <div>{client.phone}</div>}
                      {client.mobile && <div className="text-slate-500">{client.mobile}</div>}
                    </div>
                  </div>
                )}
                {client.addressLine1 && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700">
                      {client.addressLine1 && <div>{client.addressLine1}</div>}
                      {client.addressLine2 && <div>{client.addressLine2}</div>}
                      {client.city && <div>{client.city}</div>}
                      {client.postcode && <div>{client.postcode}</div>}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Verification Status */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Verification
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">ID Check</span>
                  {client.idVerified ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Source of Funds</span>
                  {client.sofVerified ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Metadata */}
            {client.type === "company" && client.companyNumber && (
              <Card className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                  Company Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-slate-500">Company Number</span>
                    <p className="text-sm font-mono text-slate-900">{client.companyNumber}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Active Matters */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Active Matters
                  {activeMatters.length > 0 && (
                    <span className="ml-2 text-slate-500">({activeMatters.length})</span>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/matters/new?clientId=${client.id}`)}
                >
                  New Matter
                </Button>
              </div>

              {mattersLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : activeMatters.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500">No active matters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMatters.map((matter) => (
                    <MatterCard key={matter.id} matter={matter} />
                  ))}
                </div>
              )}
            </Card>

            {/* Notes */}
            {client.notes && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">Notes</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {client.notes}
                </p>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">
                Recent Activity
              </h3>
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
