/**
 * Firm factory for creating test firms
 */
import { db } from "@/lib/db";
import { firms } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export interface FirmFactoryOptions {
  id?: string;
  name?: string;
  sraNumber?: string;
  status?: "trial" | "active" | "suspended" | "cancelled";
  plan?: "starter" | "professional" | "enterprise";
  email?: string;
}

export interface TestFirm {
  id: string;
  name: string;
  email: string;
  status: string;
  plan: string;
}

/**
 * Create a test firm in the database
 */
export async function createFirm(options: FirmFactoryOptions = {}): Promise<TestFirm> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const firmData = {
    id,
    name: options.name || `Test Firm ${suffix}`,
    sraNumber: options.sraNumber || `SRA${suffix}`,
    status: options.status || "active",
    plan: options.plan || "professional",
    email: options.email || `firm-${suffix}@test.example.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [firm] = await db.insert(firms).values(firmData).returning();

  return {
    id: firm.id,
    name: firm.name,
    email: firm.email || firmData.email,
    status: firm.status,
    plan: firm.plan,
  };
}

/**
 * Build firm data without inserting into database
 * Useful for testing validation or API input
 */
export function buildFirmData(options: FirmFactoryOptions = {}): Record<string, unknown> {
  const suffix = Date.now().toString(36);

  return {
    name: options.name || `Test Firm ${suffix}`,
    sraNumber: options.sraNumber || `SRA${suffix}`,
    status: options.status || "active",
    plan: options.plan || "professional",
    email: options.email || `firm-${suffix}@test.example.com`,
  };
}
