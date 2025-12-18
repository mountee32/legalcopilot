"use client";

import { useEffect, useState } from "react";
import { usePortalAuth } from "./use-portal-auth";

export interface Matter {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: string;
  practiceArea: string | null;
  billingType: string | null;
  openedAt: string;
  closedAt: string | null;
  keyDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatterDetail extends Matter {
  feeEarner: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function usePortalMatters() {
  const { sessionToken, isAuthenticated } = usePortalAuth();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionToken) {
      setIsLoading(false);
      return;
    }

    const fetchMatters = async () => {
      try {
        const response = await fetch("/api/portal/matters", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch matters");
        }

        const data = await response.json();
        setMatters(data.matters || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatters();
  }, [isAuthenticated, sessionToken]);

  return { matters, isLoading, error };
}

export function usePortalMatter(matterId: string) {
  const { sessionToken, isAuthenticated } = usePortalAuth();
  const [matter, setMatter] = useState<MatterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionToken || !matterId) {
      setIsLoading(false);
      return;
    }

    const fetchMatter = async () => {
      try {
        const response = await fetch(`/api/portal/matters/${matterId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch matter");
        }

        const data = await response.json();
        setMatter(data.matter);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatter();
  }, [isAuthenticated, sessionToken, matterId]);

  return { matter, isLoading, error };
}
