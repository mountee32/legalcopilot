/**
 * Authentication helpers for API testing
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestUser {
  id: string;
  email: string;
  token: string;
  firmId: string;
}

/**
 * Create a test user and get an auth token
 * Uses the API to create and authenticate a user
 */
export async function createTestUser(options?: {
  email?: string;
  name?: string;
  role?: string;
}): Promise<TestUser> {
  const email = options?.email || `test-${Date.now()}@example.com`;
  const name = options?.name || "Test User";

  // This would call your auth API to create a user and get a token
  // Adjust based on your actual auth implementation (Better-Auth)
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password: "test-password-123" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${await response.text()}`);
  }

  const data = await response.json();

  return {
    id: data.user.id,
    email: data.user.email,
    token: data.token,
    firmId: data.user.firmId,
  };
}

/**
 * Get auth headers for API requests
 */
export function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create authenticated fetch wrapper
 */
export function createAuthenticatedClient(token: string) {
  return {
    async get(path: string) {
      return fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: authHeaders(token),
      });
    },

    async post(path: string, body: unknown) {
      return fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
    },

    async put(path: string, body: unknown) {
      return fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
    },

    async patch(path: string, body: unknown) {
      return fetch(`${BASE_URL}${path}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
    },

    async delete(path: string) {
      return fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
    },
  };
}
