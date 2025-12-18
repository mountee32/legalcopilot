"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Client } from "@/lib/api/schemas/clients";

interface ClientListResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchClients(params: {
  page: number;
  search?: string;
  type?: string;
  status?: string;
}): Promise<ClientListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", params.page.toString());
  searchParams.set("limit", "20");
  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);

  const res = await fetch(`/api/clients?${searchParams}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }

  return res.json();
}

function ClientStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary"> = {
    active: "default",
    prospect: "secondary",
    dormant: "secondary",
    archived: "secondary",
  };

  return (
    <Badge variant={variants[status] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function ClientCard({ client }: { client: Client }) {
  const router = useRouter();

  const displayName =
    client.type === "individual"
      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
      : client.companyName || "Unnamed Client";

  return (
    <Card
      className="p-4 hover:bg-accent cursor-pointer transition-colors"
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{displayName}</h3>
            <ClientStatusBadge status={client.status} />
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{client.email}</p>
            {client.type === "company" && client.companyNumber && (
              <p className="text-xs">Co: {client.companyNumber}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs">
                {client.type.charAt(0).toUpperCase() + client.type.slice(1)}
              </span>
              {client.idVerified && (
                <Badge variant="default" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clients", page, search, typeFilter, statusFilter],
    queryFn: () =>
      fetchClients({
        page,
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
    staleTime: 30_000,
  });

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client directory</p>
          </div>
          <Button onClick={() => router.push("/clients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="trust">Trust</option>
            <option value="estate">Estate</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="dormant">Dormant</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8">
            <EmptyState
              title="Failed to load clients"
              description="There was an error loading the client list. Please try again."
            />
          </Card>
        ) : data && data.clients.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="No clients found"
              description={
                search || typeFilter || statusFilter
                  ? "Try adjusting your filters"
                  : "Get started by adding your first client"
              }
              action={
                !search && !typeFilter && !statusFilter ? (
                  <Button onClick={() => router.push("/clients/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            {/* Client List */}
            <div className="space-y-3">
              {data?.clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.pagination.total)} of{" "}
                  {data.pagination.total} clients
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
