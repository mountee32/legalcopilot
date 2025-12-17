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
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/template_db";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.BETTER_AUTH_SECRET ??= "test-secret-key-for-testing-only";
process.env.NODE_ENV ??= "test";

// MinIO environment variables for storage tests
process.env.MINIO_ENDPOINT ??= "localhost";
process.env.MINIO_PORT ??= "9000";
process.env.MINIO_ROOT_USER ??= "minioadmin";
process.env.MINIO_ROOT_PASSWORD ??= "minioadmin";
process.env.MINIO_USE_SSL ??= "false";
process.env.MINIO_BUCKET_NAME ??= "test-uploads";
