"use client";

import { useEffect, useState } from "react";
import { usePortalAuth } from "./use-portal-auth";

export interface Invoice {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: string;
    vatAmount: string | null;
    vatRate: string | null;
    total: string;
    paidAmount: string;
    balanceDue: string;
    sentAt: string | null;
    viewedAt: string | null;
    paidAt: string | null;
    createdAt: string;
  };
  matter: {
    id: string;
    reference: string;
    title: string;
  } | null;
}

export function usePortalInvoices() {
  const { sessionToken, isAuthenticated } = usePortalAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionToken) {
      setIsLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/portal/invoices", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch invoices");
        }

        const data = await response.json();
        setInvoices(data.invoices || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [isAuthenticated, sessionToken]);

  return { invoices, isLoading, error };
}
