"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface FastLoginRole {
  role: string;
  label: string;
  icon: string;
  description: string;
}

const ROLES: FastLoginRole[] = [
  { role: "firm_admin", label: "Firm Admin", icon: "👔", description: "Full access" },
  { role: "partner", label: "Partner", icon: "⚖️", description: "Senior fee earner" },
  { role: "senior_associate", label: "Sr Associate", icon: "👨‍💼", description: "Team lead" },
  { role: "associate", label: "Associate", icon: "👩‍💼", description: "Fee earner" },
  { role: "paralegal", label: "Paralegal", icon: "📋", description: "Support role" },
  { role: "secretary", label: "Secretary", icon: "📝", description: "Admin support" },
  { role: "client", label: "Client", icon: "👤", description: "Portal access" },
  { role: "super_admin", label: "Super Admin", icon: "🔧", description: "Platform admin" },
];

export function FastLoginButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFastLogin = async (role: string) => {
    setLoading(role);
    setError(null);

    try {
      const res = await fetch("/api/auth/fast-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      // Hard redirect to ensure the new session cookie is picked up
      // Using window.location instead of router.push for full page reload
      if (role === "client") {
        window.location.href = "/portal/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border/50">
      <div className="flex items-center gap-2 mb-4 justify-center">
        <span className="text-sm text-muted-foreground">Quick Login</span>
        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full">
          Dev Only
        </span>
      </div>

      {error && (
        <div className="mb-4 p-2 text-sm text-red-500 bg-red-500/10 rounded text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((r) => (
          <Button
            key={r.role}
            variant="outline"
            size="sm"
            className="flex items-center justify-start gap-2 h-auto py-2 px-3 text-left"
            onClick={() => handleFastLogin(r.role)}
            disabled={loading !== null}
          >
            {loading === r.role ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="text-base">{r.icon}</span>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium">{r.label}</span>
              <span className="text-[10px] text-muted-foreground">{r.description}</span>
            </div>
          </Button>
        ))}
      </div>

      <p className="mt-4 text-xs text-amber-600 text-center flex items-center justify-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Development mode only - not for production
      </p>
    </div>
  );
}
