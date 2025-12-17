/**
 * Matter factory for creating test matters/cases
 */
import { db } from "@/lib/db";
import { matters } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type PracticeArea =
  | "conveyancing"
  | "civil_litigation"
  | "family"
  | "wills_probate"
  | "corporate"
  | "employment"
  | "immigration"
  | "personal_injury"
  | "criminal"
  | "other";

export type MatterStatus = "active" | "pending" | "closed" | "archived";

export interface MatterFactoryOptions {
  id?: string;
  firmId: string;
  clientId: string;
  title?: string;
  reference?: string;
  practiceArea?: PracticeArea;
  status?: MatterStatus;
  feeEarnerId?: string;
  description?: string;
}

export interface TestMatter {
  id: string;
  firmId: string;
  clientId: string;
  title: string;
  reference: string;
  practiceArea: string;
  status: string;
}

/**
 * Create a test matter in the database
 */
export async function createMatter(options: MatterFactoryOptions): Promise<TestMatter> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const matterData = {
    id,
    firmId: options.firmId,
    clientId: options.clientId,
    title: options.title || `Test Matter ${suffix}`,
    reference: options.reference || `MAT-${suffix}`,
    practiceArea: options.practiceArea || "conveyancing",
    status: options.status || "active",
    feeEarnerId: options.feeEarnerId,
    description: options.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [matter] = await db.insert(matters).values(matterData).returning();

  return {
    id: matter.id,
    firmId: matter.firmId,
    clientId: matter.clientId,
    title: matter.title,
    reference: matter.reference,
    practiceArea: matter.practiceArea,
    status: matter.status,
  };
}

/**
 * Build matter data without inserting into database
 */
export function buildMatterData(
  firmId: string,
  clientId: string,
  options: Partial<MatterFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);

  return {
    firmId,
    clientId,
    title: options.title || `Test Matter ${suffix}`,
    reference: options.reference || `MAT-${suffix}`,
    practiceArea: options.practiceArea || "conveyancing",
    status: options.status || "active",
    feeEarnerId: options.feeEarnerId,
    description: options.description,
  };
}

/**
 * Create a conveyancing matter
 */
export async function createConveyancingMatter(
  firmId: string,
  clientId: string,
  options: Partial<MatterFactoryOptions> = {}
): Promise<TestMatter> {
  return createMatter({
    ...options,
    firmId,
    clientId,
    practiceArea: "conveyancing",
    title: options.title || `Property Purchase ${Date.now().toString(36)}`,
  });
}

/**
 * Create a litigation matter
 */
export async function createLitigationMatter(
  firmId: string,
  clientId: string,
  options: Partial<MatterFactoryOptions> = {}
): Promise<TestMatter> {
  return createMatter({
    ...options,
    firmId,
    clientId,
    practiceArea: "civil_litigation",
    title: options.title || `Dispute ${Date.now().toString(36)}`,
  });
}
