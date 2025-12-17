import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-testing-only";
