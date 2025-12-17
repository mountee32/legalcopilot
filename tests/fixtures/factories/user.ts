/**
 * User factory for creating test users
 */
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export interface UserFactoryOptions {
  id?: string;
  firmId: string;
  roleId?: string | null;
  email?: string;
  name?: string;
  emailVerified?: boolean;
}

export interface TestUser {
  id: string;
  firmId: string | null;
  roleId: string | null;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

/**
 * Create a test user in the database
 */
export async function createUser(options: UserFactoryOptions): Promise<TestUser> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const userData = {
    id,
    firmId: options.firmId,
    roleId: options.roleId ?? null,
    email: options.email || `user-${suffix}@test.example.com`,
    name: options.name || `Test User ${suffix}`,
    emailVerified: options.emailVerified ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [user] = await db.insert(users).values(userData).returning();

  return {
    id: user.id,
    firmId: user.firmId,
    roleId: user.roleId,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified ?? false,
  };
}

/**
 * Build user data without inserting into database
 */
export function buildUserData(
  firmId: string,
  options: Partial<UserFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);

  return {
    firmId,
    roleId: options.roleId ?? null,
    email: options.email || `user-${suffix}@test.example.com`,
    name: options.name || `Test User ${suffix}`,
    emailVerified: options.emailVerified ?? true,
  };
}

/**
 * Create multiple users for a firm
 */
export async function createUsers(
  firmId: string,
  count: number,
  options: Partial<UserFactoryOptions> = {}
): Promise<TestUser[]> {
  const users: TestUser[] = [];
  for (let i = 0; i < count; i++) {
    const user = await createUser({
      ...options,
      firmId,
      name: options.name ? `${options.name} ${i + 1}` : undefined,
    });
    users.push(user);
  }
  return users;
}
