/**
 * Custom assertions and matchers for API testing
 */
import { expect } from "vitest";

/**
 * Assert that a response is successful (2xx status)
 */
export function expectSuccess(response: Response): void {
  expect(response.ok).toBe(true);
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

/**
 * Assert that a response has a specific status code
 */
export function expectStatus(response: Response, status: number): void {
  expect(response.status).toBe(status);
}

/**
 * Assert that a response is a validation error (400)
 */
export async function expectValidationError(response: Response, fieldName?: string): Promise<void> {
  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body).toHaveProperty("error");

  if (fieldName) {
    expect(body.details || body.error).toContain(fieldName);
  }
}

/**
 * Assert that a response is unauthorized (401)
 */
export function expectUnauthorized(response: Response): void {
  expect(response.status).toBe(401);
}

/**
 * Assert that a response is forbidden (403)
 */
export function expectForbidden(response: Response): void {
  expect(response.status).toBe(403);
}

/**
 * Assert that a response is not found (404)
 */
export function expectNotFound(response: Response): void {
  expect(response.status).toBe(404);
}

/**
 * Assert that a paginated response has the expected structure
 */
export async function expectPaginatedResponse(
  response: Response,
  options?: {
    minItems?: number;
    maxItems?: number;
  }
): Promise<unknown[]> {
  expectSuccess(response);
  const body = await response.json();

  expect(body).toHaveProperty("data");
  expect(body).toHaveProperty("pagination");
  expect(Array.isArray(body.data)).toBe(true);

  if (options?.minItems !== undefined) {
    expect(body.data.length).toBeGreaterThanOrEqual(options.minItems);
  }

  if (options?.maxItems !== undefined) {
    expect(body.data.length).toBeLessThanOrEqual(options.maxItems);
  }

  return body.data;
}

/**
 * Assert that response contains required fields
 */
export async function expectFields(
  response: Response,
  fields: string[]
): Promise<Record<string, unknown>> {
  expectSuccess(response);
  const body = await response.json();

  for (const field of fields) {
    expect(body).toHaveProperty(field);
  }

  return body;
}

/**
 * Assert UUID format
 */
export function expectUUID(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
}

/**
 * Assert ISO date format
 */
export function expectISODate(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(new Date(value as string).toISOString()).toBe(value);
}
