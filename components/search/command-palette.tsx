"use client";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, Clock, FolderKanban, Users, Mail } from "lucide-react";
import { useCommandPalette } from "@/lib/hooks/use-command-palette";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { useRecentItems } from "@/lib/hooks/use-recent-items";
import { SearchResults } from "./search-results";
import { SearchItem } from "./search-item";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGlobalSearch(query);
  const { items: recentItems } = useRecentItems();
  const router = useRouter();

  // Reset query when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const quickActions = [
    {
      id: "new-matter",
      label: "New Matter",
      icon: FolderKanban,
      shortcut: "⌘N",
      href: "/matters/new",
    },
    {
      id: "new-client",
      label: "New Client",
      icon: Users,
      shortcut: "⌘⇧N",
      href: "/clients/new",
    },
    {
      id: "record-time",
      label: "Record Time",
      icon: Clock,
      shortcut: "⌘T",
      href: "/billing/time/new",
    },
    {
      id: "compose-email",
      label: "Compose Email",
      icon: Mail,
      shortcut: "⌘E",
      href: "/emails/compose",
    },
  ];

  const handleQuickAction = (href: string) => {
    router.push(href);
    close();
  };

  const handleRecentItemSelect = (href: string) => {
    router.push(href);
    close();
  };

  if (!isOpen) return null;

  const showSearchResults = query.length >= 2;
  const showDefaultContent = !showSearchResults;

  return (
    <div className="fixed inset-0 z-50 bg-black/80" onClick={close}>
      <div
        className="fixed left-[50%] top-[20%] translate-x-[-50%] w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-lg border shadow-lg bg-background" shouldFilter={false} loop>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search matters, clients, documents..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={query}
              onValueChange={setQuery}
            />
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[500px] overflow-y-auto p-2">
            {showSearchResults ? (
              <SearchResults
                matters={data?.matters}
                clients={data?.clients}
                documents={data?.documents}
                isLoading={isLoading}
                onSelect={close}
              />
            ) : (
              <>
                {recentItems.length > 0 && (
                  <Command.Group heading="Recent">
                    {recentItems.map((item) => (
                      <Command.Item
                        key={`${item.type}-${item.id}`}
                        value={`recent-${item.type}-${item.id}`}
                        onSelect={() => handleRecentItemSelect(item.href)}
                      >
                        <SearchItem type={item.type} label={item.label} sublabel={item.sublabel} />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Quick Actions">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Command.Item
                        key={action.id}
                        value={action.id}
                        onSelect={() => handleQuickAction(action.href)}
                      >
                        <div className="flex items-center gap-3 w-full px-2 py-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 text-sm font-medium">{action.label}</span>
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            {action.shortcut}
                          </kbd>
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                {recentItems.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <p>Start typing to search...</p>
                  </div>
                )}
              </>
            )}

            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
