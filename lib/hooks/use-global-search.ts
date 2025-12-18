"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export interface MatterSearchResult {
  id: string;
  reference: string;
  title: string;
  clientName: string;
  stage: string;
  practiceArea: string;
  snippet?: string;
}

export interface ClientSearchResult {
  id: string;
  name: string;
  email: string;
  type: "individual" | "company";
  activeMatters: number;
  snippet?: string;
}

export interface DocumentSearchResult {
  id: string;
  filename: string;
  matterId: string;
  matterReference: string;
  uploadedAt: string;
  snippet?: string;
  score: number;
}

export interface GlobalSearchResponse {
  matters: MatterSearchResult[];
  clients: ClientSearchResult[];
  documents: DocumentSearchResult[];
  query: string;
  totalResults: number;
}

async function fetchGlobalSearch(query: string): Promise<GlobalSearchResponse> {
  const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  return res.json();
}

export function useGlobalSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["search", "global", debouncedQuery],
    queryFn: () => fetchGlobalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
