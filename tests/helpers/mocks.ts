/**
 * Reusable mock utilities for unit tests
 *
 * IMPORTANT: withFirmDb takes a callback function, so standard mockResolvedValue
 * and mockRejectedValue patterns DO NOT WORK. Use these helpers instead.
 *
 * @example
 * ```typescript
 * import {
 *   mockUser,
 *   mockFirmId,
 *   mockWithFirmDbSuccess,
 *   mockWithFirmDbError,
 *   createMockTransaction,
 *   createMockRequest,
 *   createMockContext,
 * } from "@tests/helpers/mocks";
 * import { NotFoundError } from "@/middleware/withErrorHandler";
 * ```
 */

import { vi } from "vitest";

/**
 * Standard mock user for authenticated endpoint tests
 */
export const mockUser = {
  user: {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  },
  session: {
    id: "session-123",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
};

/**
 * Standard mock firm ID for tenant-scoped tests
 */
export const mockFirmId = "firm-123";

/**
 * Create a mock for withFirmDb that returns the given data
 *
 * @example
 * ```typescript
 * vi.mocked(withFirmDb).mockImplementation(
 *   mockWithFirmDbSuccess({ id: "1", name: "Test" })
 * );
 * ```
 */
export function mockWithFirmDbSuccess<T>(data: T) {
  return async (firmId: string, callback: (tx: any) => Promise<any>) => {
    return data;
  };
}

/**
 * Create a mock for withFirmDb that throws an error
 *
 * @example
 * ```typescript
 * vi.mocked(withFirmDb).mockImplementation(
 *   mockWithFirmDbError(new NotFoundError("Not found"))
 * );
 * ```
 */
export function mockWithFirmDbError(error: Error) {
  return async (firmId: string, callback: (tx: any) => Promise<any>) => {
    throw error;
  };
}

/**
 * Create a mock for withFirmDb that executes the callback with a mock transaction
 * Useful when you need to verify what the callback does
 *
 * @example
 * ```typescript
 * const mockTx = createMockTransaction([{ id: "1" }]);
 * vi.mocked(withFirmDb).mockImplementation(
 *   mockWithFirmDbCallback(mockTx, { id: "1", name: "Created" })
 * );
 * ```
 */
export function mockWithFirmDbCallback<T>(mockTx: any, returnValue: T) {
  return async (firmId: string, callback: (tx: any) => Promise<any>) => {
    await callback(mockTx);
    return returnValue;
  };
}

/**
 * Create a chainable mock transaction object for Drizzle ORM queries
 *
 * @example
 * ```typescript
 * const mockTx = createMockTransaction([{ id: "1", name: "Test" }]);
 * // mockTx.select().from().where().limit() returns the data
 * ```
 */
export function createMockTransaction(selectResult: any[] = [], updateResult: any[] = []) {
  const mockTx: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(selectResult),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(updateResult.length ? updateResult : selectResult),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
  };
  return mockTx;
}

/**
 * Create a mock Request object for API route testing
 *
 * @example
 * ```typescript
 * const request = createMockRequest("POST", "/api/matters", { name: "Test" });
 * ```
 */
export function createMockRequest(
  method: string,
  url: string,
  body?: Record<string, any>,
  headers?: Record<string, string>
) {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create mock params for Next.js App Router route handlers
 *
 * @example
 * ```typescript
 * const params = createMockParams({ id: "matter-123" });
 * await GET(request, { params, user: mockUser });
 * ```
 */
export function createMockParams(params: Record<string, string>) {
  return Promise.resolve(params);
}

/**
 * Create mock route context for authenticated endpoints
 *
 * @example
 * ```typescript
 * const context = createMockContext({ id: "matter-123" });
 * await GET(request, context);
 * ```
 */
export function createMockContext(params: Record<string, string> = {}, user = mockUser) {
  return {
    params: Promise.resolve(params),
    user,
  };
}

/**
 * Setup common mocks for API route tests
 * Call this in beforeEach to reset mocks
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   setupApiMocks();
 * });
 * ```
 */
export function setupApiMocks() {
  vi.clearAllMocks();

  // Mock tenancy
  vi.doMock("@/lib/tenancy", () => ({
    getOrCreateFirmIdForUser: vi.fn().mockResolvedValue(mockFirmId),
  }));

  // Mock timeline events (usually don't need to verify these)
  vi.doMock("@/lib/timeline/createEvent", () => ({
    createTimelineEvent: vi.fn().mockResolvedValue(undefined),
  }));
}
