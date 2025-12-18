"use client";

import { Scale, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/lib/hooks/use-portal-auth";

export function PortalHeader() {
  const { logout } = usePortalAuth();

  return (
    <header className="border-b bg-white dark:bg-slate-900">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Legal Copilot</span>
        </Link>

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
