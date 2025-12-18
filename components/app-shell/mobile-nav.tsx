"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, FolderKanban, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/matters", icon: FolderKanban, label: "Cases" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden"
      data-testid="mobile-nav"
    >
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
            data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            data-active={isActive}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}

      {/* Quick action button */}
      <button
        className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground"
        data-testid="mobile-nav-quick-action"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium">New</span>
      </button>
    </nav>
  );
}
