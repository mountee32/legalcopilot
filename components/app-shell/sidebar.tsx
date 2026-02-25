"use client";

import Link from "next/link";
import {
  Home,
  Inbox,
  FolderKanban,
  Users,
  FileText,
  CheckSquare,
  Bell,
  Calendar,
  Clock,
  BarChart3,
  Filter,
  UsersRound,
  Settings,
  HelpCircle,
  Scale,
  GitBranch,
  Shield,
  Activity,
  ClipboardCheck,
  FileStack,
  FileSignature,
  Receipt,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { UserMenu } from "./user-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUnreadCount } from "@/lib/hooks/use-notifications";

const secondaryNavItems = [
  { href: "/billing", icon: Clock, label: "Time & Billing" },
  { href: "/analytics", icon: Activity, label: "Analytics" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/compliance", icon: Shield, label: "Compliance" },
  { href: "/approvals", icon: ClipboardCheck, label: "Approvals" },
  { href: "/settings/workflows", icon: GitBranch, label: "Workflows" },
  { href: "/templates", icon: FileStack, label: "Templates" },
  { href: "/e-signatures", icon: FileSignature, label: "E-Signatures" },
];

const tertiaryNavItems = [
  { href: "/leads", icon: Filter, label: "Leads" },
  { href: "/quotes", icon: Receipt, label: "Quotes" },
  { href: "/team", icon: UsersRound, label: "Team" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const unreadCount = useUnreadCount();

  const mainNavItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/inbox", icon: Inbox, label: "AI Inbox" },
    { href: "/matters", icon: FolderKanban, label: "Cases" },
    { href: "/clients", icon: Users, label: "Clients" },
    { href: "/documents", icon: FileText, label: "Documents" },
    { href: "/tasks", icon: CheckSquare, label: "Tasks" },
    { href: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { href: "/calendar", icon: Calendar, label: "Calendar" },
  ];

  return (
    <aside
      className="hidden md:flex h-screen w-64 flex-col border-r bg-background"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Legal Copilot</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {secondaryNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {tertiaryNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3 space-y-1">
        <NavItem href="/help" icon={HelpCircle} label="Help" />
        <UserMenu />
      </div>
    </aside>
  );
}
