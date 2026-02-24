"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  PipelineHealthResponse,
  ExtractionQualityResponse,
  RiskOverviewResponse,
} from "@/lib/api/schemas/analytics";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

export function useAnalyticsData(days = 30) {
  const pipelineQuery = useQuery({
    queryKey: ["analytics", "pipeline", days],
    queryFn: () => fetchJSON<PipelineHealthResponse>(`/api/analytics/pipeline?days=${days}`),
    staleTime: 60_000,
  });

  const extractionQuery = useQuery({
    queryKey: ["analytics", "extraction", days],
    queryFn: () => fetchJSON<ExtractionQualityResponse>(`/api/analytics/extraction?days=${days}`),
    staleTime: 60_000,
  });

  const riskQuery = useQuery({
    queryKey: ["analytics", "risk", days],
    queryFn: () => fetchJSON<RiskOverviewResponse>(`/api/analytics/risk?days=${days}`),
    staleTime: 60_000,
  });

  return {
    pipeline: pipelineQuery.data,
    extraction: extractionQuery.data,
    risk: riskQuery.data,
    isLoading: pipelineQuery.isLoading || extractionQuery.isLoading || riskQuery.isLoading,
    isError: pipelineQuery.isError || extractionQuery.isError || riskQuery.isError,
    refetch: () => {
      pipelineQuery.refetch();
      extractionQuery.refetch();
      riskQuery.refetch();
    },
  };
}
