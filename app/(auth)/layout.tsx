import { Scale } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="mb-8 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Scale className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Legal Copilot</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
