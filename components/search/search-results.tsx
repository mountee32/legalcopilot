"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { SearchItem } from "./search-item";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  MatterSearchResult,
  ClientSearchResult,
  DocumentSearchResult,
} from "@/lib/hooks/use-global-search";

interface SearchResultsProps {
  matters?: MatterSearchResult[];
  clients?: ClientSearchResult[];
  documents?: DocumentSearchResult[];
  isLoading?: boolean;
  onSelect?: () => void;
}

export function SearchResults({
  matters = [],
  clients = [],
  documents = [],
  isLoading = false,
  onSelect,
}: SearchResultsProps) {
  const router = useRouter();

  const totalResults = matters.length + clients.length + documents.length;

  if (isLoading) {
    return (
      <div className="px-2 py-3 space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (totalResults === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        <p>No results found</p>
        <p className="mt-1 text-xs">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {matters.length > 0 && (
        <Command.Group heading="Matters">
          {matters.map((matter) => (
            <Command.Item
              key={matter.id}
              value={`matter-${matter.id}`}
              onSelect={() => {
                router.push(`/matters/${matter.id}`);
                onSelect?.();
              }}
            >
              <SearchItem
                type="matter"
                label={`${matter.reference} - ${matter.title}`}
                sublabel={`${matter.clientName} • ${matter.practiceArea} • ${matter.stage}`}
                snippet={matter.snippet}
              />
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {clients.length > 0 && (
        <Command.Group heading="Clients">
          {clients.map((client) => (
            <Command.Item
              key={client.id}
              value={`client-${client.id}`}
              onSelect={() => {
                router.push(`/clients/${client.id}`);
                onSelect?.();
              }}
            >
              <SearchItem
                type="client"
                label={client.name}
                sublabel={`${client.email} • ${client.activeMatters} active ${client.activeMatters === 1 ? "matter" : "matters"}`}
                snippet={client.snippet}
              />
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {documents.length > 0 && (
        <Command.Group heading="Documents">
          {documents.map((doc) => (
            <Command.Item
              key={doc.id}
              value={`document-${doc.id}`}
              onSelect={() => {
                router.push(`/matters/${doc.matterId}/documents`);
                onSelect?.();
              }}
            >
              <SearchItem
                type="document"
                label={doc.filename}
                sublabel={`${doc.matterReference} • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                snippet={doc.snippet}
              />
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </div>
  );
}
