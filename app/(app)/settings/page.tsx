import Link from "next/link";
import { Brain, Plug, GitBranch, Bell, CalendarClock, ChevronRight, Settings } from "lucide-react";

const SETTINGS_LINKS = [
  {
    href: "/settings/taxonomy",
    icon: Brain,
    title: "AI Taxonomy Packs",
    description: "Configure extraction categories, fields, and document types for AI pipelines.",
  },
  {
    href: "/settings/integrations",
    icon: Plug,
    title: "Integrations",
    description: "Connect email, calendar, accounting, and payment provider accounts.",
  },
  {
    href: "/settings/workflows",
    icon: GitBranch,
    title: "Workflows",
    description: "Define automation rules, approval chains, and stage-gate processes.",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notification Preferences",
    description: "Choose which events trigger alerts and how they are delivered.",
  },
  {
    href: "/settings/booking",
    icon: CalendarClock,
    title: "Booking & Availability",
    description: "Set working hours, availability windows, and client booking options.",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-testid="settings-page">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-6 w-6 text-slate-700" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">
              Configure your firm&apos;s preferences and integrations
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 rounded-lg border bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <link.icon className="h-5 w-5 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{link.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{link.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
