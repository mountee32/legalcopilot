/**
 * Lead factory for creating test leads
 */
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost" | "archived";
export type PracticeArea =
  | "conveyancing"
  | "litigation"
  | "family"
  | "probate"
  | "employment"
  | "immigration"
  | "personal_injury"
  | "commercial"
  | "criminal"
  | "ip"
  | "insolvency"
  | "other";

export interface LeadFactoryOptions {
  id?: string;
  firmId: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string;
  email?: string;
  phone?: string;
  enquiryType?: PracticeArea;
  message?: string;
  source?: string;
  status?: LeadStatus;
  score?: number;
  notes?: string;
  assignedTo?: string;
  convertedToClientId?: string;
  createdById?: string;
}

export interface TestLead {
  id: string;
  firmId: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  enquiryType: string | null;
  message: string | null;
  source: string | null;
  status: string;
  score: number | null;
  notes: string | null;
  assignedTo: string | null;
  convertedToClientId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a test lead in the database
 */
export async function createLead(options: LeadFactoryOptions): Promise<TestLead> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const leadData = {
    id,
    firmId: options.firmId,
    firstName:
      options.firstName !== undefined ? options.firstName : options.companyName ? null : `Test`,
    lastName:
      options.lastName !== undefined
        ? options.lastName
        : options.companyName
          ? null
          : `Lead-${suffix}`,
    companyName: options.companyName ?? null,
    email: options.email || `lead-${suffix}@test.example.com`,
    phone: options.phone ?? null,
    enquiryType: (options.enquiryType ?? null) as "conveyancing" | null,
    message: options.message ?? null,
    source: options.source ?? null,
    status: (options.status || "new") as "new",
    score: options.score ?? null,
    notes: options.notes ?? null,
    assignedTo: options.assignedTo ?? null,
    convertedToClientId: options.convertedToClientId ?? null,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [lead] = await db.insert(leads).values(leadData).returning();

  return {
    id: lead.id,
    firmId: lead.firmId,
    firstName: lead.firstName,
    lastName: lead.lastName,
    companyName: lead.companyName,
    email: lead.email,
    phone: lead.phone,
    enquiryType: lead.enquiryType,
    message: lead.message,
    source: lead.source,
    status: lead.status,
    score: lead.score,
    notes: lead.notes,
    assignedTo: lead.assignedTo,
    convertedToClientId: lead.convertedToClientId,
    createdById: lead.createdById,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

/**
 * Create a company lead
 */
export async function createCompanyLead(
  firmId: string,
  options: Partial<LeadFactoryOptions> = {}
): Promise<TestLead> {
  const suffix = Date.now().toString(36);
  return createLead({
    firmId,
    companyName: options.companyName || `Test Company ${suffix}`,
    firstName: null,
    lastName: null,
    ...options,
  });
}

/**
 * Create an individual lead
 */
export async function createIndividualLead(
  firmId: string,
  options: Partial<LeadFactoryOptions> = {}
): Promise<TestLead> {
  return createLead({
    ...options,
    firmId,
    companyName: null as any,
  });
}

/**
 * Create multiple leads for pagination testing
 */
export async function createManyLeads(
  firmId: string,
  count: number,
  options: Partial<LeadFactoryOptions> = {}
): Promise<TestLead[]> {
  const leads: TestLead[] = [];
  for (let i = 0; i < count; i++) {
    const lead = await createLead({
      ...options,
      firmId,
      firstName: options.firstName || `Test${i}`,
      lastName: options.lastName || `Lead${i}`,
    });
    leads.push(lead);
  }
  return leads;
}
