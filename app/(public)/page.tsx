import { Scale } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <Scale className="w-10 h-10 text-slate-800" strokeWidth={1.5} />
          <span className="text-3xl font-light tracking-tight text-slate-800">Legal Copilot</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-light text-slate-900 leading-tight">
            AI-powered practice management
            <br />
            <span className="text-slate-500">for UK law firms</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto font-light">
            We handle 80% of your administrative work autonomously. You review and approve, not
            draft and chase.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Get started
            </Button>
          </Link>
        </div>

        {/* Features preview */}
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4">
            <h3 className="font-medium text-slate-900 mb-1">AI Drafting</h3>
            <p className="text-sm text-slate-500">
              Letters, emails, and documents drafted automatically from context
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-slate-900 mb-1">Smart Billing</h3>
            <p className="text-sm text-slate-500">
              Time entries captured and invoices generated with zero admin
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-slate-900 mb-1">SRA Compliant</h3>
            <p className="text-sm text-slate-500">
              Built for UK law firms with full audit trails and compliance
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Legal Copilot. All rights reserved.
      </footer>
    </main>
  );
}
