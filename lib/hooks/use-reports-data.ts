"use client";

import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import type {
  DashboardReportSchema,
  ProductivityReportSchema,
  BillingReportSchema,
  MatterSummaryReportSchema,
  FunnelReportSchema,
} from "@/lib/api/schemas/reports";

export type DashboardReport = z.infer<typeof DashboardReportSchema>;
export type ProductivityReport = z.infer<typeof ProductivityReportSchema>;
export type BillingReport = z.infer<typeof BillingReportSchema>;
export type MatterSummaryReport = z.infer<typeof MatterSummaryReportSchema>;
export type FunnelReport = z.infer<typeof FunnelReportSchema>;

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

function buildQS(from?: string, to?: string, practiceArea?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (practiceArea) params.set("practiceArea", practiceArea);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useDashboardReport(
  from?: string,
  to?: string,
  practiceArea?: string,
  enabled = true
) {
  const qs = buildQS(from, to, practiceArea);
  return useQuery({
    queryKey: ["reports", "dashboard", from, to, practiceArea],
    queryFn: () => fetchJSON<DashboardReport>(`/api/reports/dashboard${qs}`),
    staleTime: 60_000,
    enabled,
  });
}

export function useProductivityReport(
  from?: string,
  to?: string,
  practiceArea?: string,
  enabled = true
) {
  const qs = buildQS(from, to, practiceArea);
  return useQuery({
    queryKey: ["reports", "productivity", from, to, practiceArea],
    queryFn: () => fetchJSON<ProductivityReport>(`/api/reports/productivity${qs}`),
    staleTime: 60_000,
    enabled,
  });
}

export function useBillingReport(
  from?: string,
  to?: string,
  practiceArea?: string,
  enabled = true
) {
  const qs = buildQS(from, to, practiceArea);
  return useQuery({
    queryKey: ["reports", "billing", from, to, practiceArea],
    queryFn: () => fetchJSON<BillingReport>(`/api/reports/billing${qs}`),
    staleTime: 60_000,
    enabled,
  });
}

export function useMatterReport(from?: string, to?: string, practiceArea?: string, enabled = true) {
  const qs = buildQS(from, to, practiceArea);
  return useQuery({
    queryKey: ["reports", "matters", from, to, practiceArea],
    queryFn: () => fetchJSON<MatterSummaryReport>(`/api/reports/matters${qs}`),
    staleTime: 60_000,
    enabled,
  });
}

export function useFunnelReport(from?: string, to?: string, practiceArea?: string, enabled = true) {
  const qs = buildQS(from, to, practiceArea);
  return useQuery({
    queryKey: ["reports", "funnel", from, to, practiceArea],
    queryFn: () => fetchJSON<FunnelReport>(`/api/reports/funnel${qs}`),
    staleTime: 60_000,
    enabled,
  });
}
