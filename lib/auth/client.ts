"use client";

import { createAuthClient } from "better-auth/react";

// Use relative URL so auth works regardless of host (localhost, IP, domain)
// Better-Auth will use the current origin when baseURL is empty or relative
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const { signIn, signUp, signOut, useSession } = authClient;
