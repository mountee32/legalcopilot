/**
 * User & Authentication Schema
 *
 * Core user identity and authentication tables.
 * Uses better-auth for session management.
 *
 * @see docs/backend-design.md Section 2.1 for full User specification
 */

import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { roles } from "./roles";

/**
 * Core user account.
 * Represents a fee earner, admin, or other system user.
 *
 * Note: This is the authentication user, not to be confused with
 * Client (external person/company the firm represents).
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Firm/tenant this user belongs to (set lazily on first use) */
  firmId: uuid("firm_id").references(() => firms.id, { onDelete: "set null" }),

  /** Firm role for RBAC (set lazily on first use) */
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),

  /** Primary email address - used for login */
  email: text("email").notNull().unique(),

  /** Display name */
  name: text("name"),

  /** Profile image URL */
  image: text("image"),

  /** Whether email has been verified */
  emailVerified: boolean("email_verified").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Active user sessions.
 * Managed by better-auth.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Reference to the authenticated user */
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** When this session expires */
  expiresAt: timestamp("expires_at").notNull(),

  /** Session token for authentication */
  token: text("token").notNull().unique(),

  /** IP address of session creation (for security audit) */
  ipAddress: text("ip_address"),

  /** Browser/client user agent string */
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * OAuth provider accounts linked to users.
 * Supports Google, Microsoft, etc.
 * Field names match Better Auth's expected schema.
 */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** User this account belongs to */
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** OAuth provider ID (e.g., "google", "github", "credential") */
  providerId: text("provider_id").notNull(),

  /** Account ID from the OAuth provider (or email for credential auth) */
  accountId: text("account_id").notNull(),

  /** OAuth access token */
  accessToken: text("access_token"),

  /** OAuth refresh token */
  refreshToken: text("refresh_token"),

  /** Access token expiration time */
  accessTokenExpiresAt: timestamp("access_token_expires_at"),

  /** Refresh token expiration time */
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),

  /** OAuth scopes granted */
  scope: text("scope"),

  /** OpenID Connect ID token */
  idToken: text("id_token"),

  /** Hashed password (for credential auth only) */
  password: text("password"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports for application use
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
