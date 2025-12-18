import { Scale } from "lucide-react";
import Link from "next/link";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex items-center justify-center p-4">
        <Link href="/portal/login" className="flex items-center gap-2">
          <Scale className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Legal Copilot</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
