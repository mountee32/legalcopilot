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
export * from "./task-bulk";
export * from "./task-templates";
export * from "./task-notes";
export * from "./evidence";
export * from "./workflows";
export * from "./emails";
export * from "./time-entries";
export * from "./invoices";
export * from "./payments";
export * from "./calendar";
export * from "./templates";
export * from "./intake";
export * from "./conflicts";
export * from "./integrations";
export * from "./search";
export * from "./team";
export * from "./reports";
export * from "./practice-modules";
export * from "./taxonomy";
export * from "./pipeline";
export * from "./email-imports";
export * from "./generation";

// TODO: Add as implemented:
// export * from "./users";
