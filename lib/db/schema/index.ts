/**
 * Database Schema Index
 *
 * Re-exports all domain schemas for convenient importing.
 * Use this file to import schema definitions:
 *
 * @example
 * import { users, clients, matters } from "@/lib/db/schema";
 * import type { Client, Matter } from "@/lib/db/schema";
 *
 * @see docs/backend-design.md for full data model specification
 */

// User & Authentication
export * from "./users";

// System & Infrastructure
export * from "./system";

// Tenancy
export * from "./firms";
export * from "./roles";

// Core Business Domains
export * from "./clients";
export * from "./matters";
export * from "./documents";
export * from "./billing";
export * from "./timeline";
export * from "./tasks";
export * from "./task-templates";
export * from "./task-notes";
export * from "./evidence";
export * from "./exceptions";
export * from "./workflows";
export * from "./emails";
export * from "./calendar";
export * from "./templates";
export * from "./intake";
export * from "./conflicts";
export * from "./integrations";

// Compliance & Audit
export * from "./approvals";
export * from "./audit";
export * from "./compliance";

// Notifications
export * from "./notifications";

// Client Portal
export * from "./portal";

// Team & Resources
export * from "./team";

// Booking & Scheduling
export * from "./booking";
