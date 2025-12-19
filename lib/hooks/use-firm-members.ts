"use client";

import { useQuery } from "@tanstack/react-query";

export interface FirmMember {
  id: string;
  name: string | null;
  email: string;
}

interface FirmMembersResponse {
  members: FirmMember[];
}

async function fetchFirmMembers(): Promise<FirmMembersResponse> {
  const res = await fetch("/api/firm/members", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch firm members");
  }

  return res.json();
}

/**
 * Hook to fetch all members of the current user's firm.
 * Used for assignee dropdowns in task forms.
 */
export function useFirmMembers() {
  return useQuery({
    queryKey: ["firm-members"],
    queryFn: fetchFirmMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
