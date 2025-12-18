"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePortalAuth } from "@/lib/hooks/use-portal-auth";
import { Loader2 } from "lucide-react";

interface PortalGateProps {
  children: React.ReactNode;
}

export function PortalGate({ children }: PortalGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = usePortalAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/portal/login");
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" data-testid="portal-gate-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
