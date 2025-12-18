"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface PortalAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  clientId: string | null;
  expiresAt: string | null;
}

export function usePortalAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<PortalAuthState>({
    isAuthenticated: false,
    isLoading: true,
    sessionToken: null,
    clientId: null,
    expiresAt: null,
  });

  useEffect(() => {
    // Check for stored session on mount
    const sessionToken = localStorage.getItem("portal_session_token");
    const expiresAt = localStorage.getItem("portal_session_expires");
    const clientId = localStorage.getItem("portal_client_id");

    if (!sessionToken || !expiresAt || !clientId) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        sessionToken: null,
        clientId: null,
        expiresAt: null,
      });
      return;
    }

    // Check if session has expired
    const expiryDate = new Date(expiresAt);
    if (expiryDate < new Date()) {
      // Session expired, clear storage
      localStorage.removeItem("portal_session_token");
      localStorage.removeItem("portal_session_expires");
      localStorage.removeItem("portal_client_id");

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        sessionToken: null,
        clientId: null,
        expiresAt: null,
      });
      return;
    }

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      sessionToken,
      clientId,
      expiresAt,
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("portal_session_token");
    localStorage.removeItem("portal_session_expires");
    localStorage.removeItem("portal_client_id");

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null,
      clientId: null,
      expiresAt: null,
    });

    router.push("/portal/login");
  };

  return {
    ...authState,
    logout,
  };
}
