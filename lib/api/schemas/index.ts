/**
 * API Schemas Index
 *
 * Re-exports all API schemas for convenient importing.
 * These schemas are used for:
 * - Request/response validation
 * - OpenAPI documentation generation
 * - TypeScript type inference
 *
 * @example
 * import { ClientSchema, CreateClientSchema } from "@/lib/api/schemas";
 * import type { Client, CreateClient } from "@/lib/api/schemas";
 */

// Common schemas (pagination, errors, etc.)
export * from "./common";

// Domain schemas
export * from "./clients";
export * from "./matters";
export * from "./approvals";
export * from "./documents";
export * from "./firms";
export * from "./roles";
export * from "./timeline";
export * from "./notifications";
export * from "./tasks";
export * from "./emails";

// TODO: Add as implemented:
// export * from "./billing";
// export * from "./users";
