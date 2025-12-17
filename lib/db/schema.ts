import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  data: jsonb("data"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  result: jsonb("result"),
  error: text("error"),
  attempts: text("attempts").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  bucket: text("bucket").notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
