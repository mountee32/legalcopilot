import Link from "next/link";
import {
  HelpCircle,
  LayoutDashboard,
  Briefcase,
  Mail,
  FileText,
  CheckSquare,
  Calendar,
  Keyboard,
  MessageCircle,
} from "lucide-react";

const QUICK_LINKS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/matters", icon: Briefcase, label: "Cases" },
  { href: "/inbox", icon: Mail, label: "Inbox" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
] as const;

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], action: "Open command palette" },
  { keys: ["Ctrl", "N"], action: "Create new matter" },
  { keys: ["Ctrl", "/"], action: "Focus search" },
  { keys: ["Ctrl", "B"], action: "Toggle sidebar" },
  { keys: ["?"], action: "Show keyboard shortcuts" },
] as const;

const FAQS = [
  {
    q: "How does the AI pipeline process documents?",
    a: "When you upload a document, it goes through a 6-stage pipeline: upload, OCR, classification, extraction, reconciliation, and action generation. Each stage runs automatically and findings are presented for your review.",
  },
  {
    q: "Can I override AI-generated findings?",
    a: "Yes. Every finding has Accept, Reject, and Revise options. Revisions can be scoped to a single finding or applied as a firm-wide learning rule so future extractions improve automatically.",
  },
  {
    q: "How is my data secured?",
    a: "All data is encrypted at rest and in transit. Each firm is fully isolated with tenant-scoped database queries. AI prompts never include data from other firms.",
  },
  {
    q: "What file formats are supported?",
    a: "PDF, DOCX, DOC, JPG, PNG, and TIFF. The OCR stage handles scanned documents and images automatically.",
  },
  {
    q: "How do I connect my email?",
    a: "Go to Settings > Integrations and connect your Microsoft 365 or Google Workspace account. Incoming emails are automatically matched to matters and analysed by AI.",
  },
] as const;

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-testid="help-page">
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-slate-700" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Help & Support</h1>
            <p className="text-sm text-slate-500">
              Quick start guides, shortcuts, and answers to common questions
            </p>
          </div>
        </div>

        {/* Quick Start Links */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Start</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
              >
                <link.icon className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Keyboard className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Keyboard Shortcuts</h2>
          </div>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {SHORTCUTS.map((shortcut) => (
                  <tr key={shortcut.action} className="border-b last:border-b-0">
                    <td className="px-4 py-2.5 w-40">
                      <span className="inline-flex gap-1">
                        {shortcut.keys.map((key) => (
                          <kbd
                            key={key}
                            className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-xs text-slate-700"
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{shortcut.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border bg-white [&_summary]:cursor-pointer"
              >
                <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50/50">
                  {faq.q}
                  <span className="ml-2 shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                    &#9662;
                  </span>
                </summary>
                <p className="px-4 pb-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Contact Support</h2>
          </div>
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-slate-600">
              Need more help? Reach out to our support team at{" "}
              <a
                href="mailto:support@legalcopilot.com"
                className="font-medium text-blue-600 hover:underline"
              >
                support@legalcopilot.com
              </a>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Typical response time: within 4 working hours
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
