"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "@/components/search/command-palette";
import { CommandPaletteProvider } from "@/components/providers/command-palette-provider";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <CommandPaletteProvider>
      <div className="flex h-screen bg-background" data-testid="app-shell">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>

          {/* Mobile bottom navigation */}
          <MobileNav />
        </div>

        {/* Global command palette */}
        <CommandPalette />
      </div>
    </CommandPaletteProvider>
  );
}
