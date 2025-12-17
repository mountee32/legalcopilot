"use client";

import { useState } from "react";
import { Scale, Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // For now, just simulate submission - connect to actual endpoint later
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitted(true);
    setLoading(false);
  };

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

        {/* Email signup */}
        <div className="pt-8">
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Notify me
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-slate-600 bg-slate-100 rounded-lg py-4 px-6 max-w-md mx-auto">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Thanks! We&apos;ll be in touch when we launch.</span>
            </div>
          )}
          <p className="text-sm text-slate-400 mt-4">
            Be the first to know when we launch. No spam, unsubscribe anytime.
          </p>
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
        © {new Date().getFullYear()} Legal Copilot. All rights reserved.
      </footer>
    </main>
  );
}
