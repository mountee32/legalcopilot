"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderOpen, FileText, Receipt } from "lucide-react";

const navItems = [
  {
    href: "/portal/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/portal/matters",
    label: "My Cases",
    icon: FolderOpen,
  },
  {
    href: "/portal/documents",
    label: "Documents",
    icon: FileText,
  },
  {
    href: "/portal/invoices",
    label: "Invoices",
    icon: Receipt,
  },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
