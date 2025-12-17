/**
 * Time Entry factory for creating test time entries
 */
import { db } from "@/lib/db";
import { timeEntries } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type TimeEntryStatus = "draft" | "submitted" | "approved" | "billed" | "written_off";
export type TimeEntrySource =
  | "manual"
  | "ai_suggested"
  | "email_inferred"
  | "document_activity"
  | "calendar";

export interface TimeEntryFactoryOptions {
  id?: string;
  firmId: string;
  matterId: string;
  feeEarnerId: string;
  workDate?: string;
  description?: string;
  durationMinutes?: number;
  hourlyRate?: string;
  amount?: string;
  status?: TimeEntryStatus;
  source?: TimeEntrySource;
  isBillable?: boolean;
  invoiceId?: string | null;
  activityCode?: string | null;
}

export interface TestTimeEntry {
  id: string;
  firmId: string;
  matterId: string;
  feeEarnerId: string;
  workDate: string;
  description: string;
  durationMinutes: number;
  hourlyRate: string;
  amount: string;
  status: string;
  source: string;
  isBillable: boolean;
  invoiceId: string | null;
}

/**
 * Calculate amount from duration and hourly rate
 */
function calculateAmount(durationMinutes: number, hourlyRate: string): string {
  const hours = durationMinutes / 60;
  const rate = parseFloat(hourlyRate);
  return (hours * rate).toFixed(2);
}

/**
 * Create a test time entry in the database
 */
export async function createTimeEntry(options: TimeEntryFactoryOptions): Promise<TestTimeEntry> {
  const id = options.id || randomUUID();
  const durationMinutes = options.durationMinutes ?? 60;
  const hourlyRate = options.hourlyRate ?? "200.00";
  const amount = options.amount ?? calculateAmount(durationMinutes, hourlyRate);

  const timeEntryData = {
    id,
    firmId: options.firmId,
    matterId: options.matterId,
    feeEarnerId: options.feeEarnerId,
    workDate: options.workDate || new Date().toISOString().split("T")[0],
    description: options.description || "Test time entry work",
    durationMinutes,
    hourlyRate,
    amount,
    status: options.status || "draft",
    source: options.source || "manual",
    isBillable: options.isBillable ?? true,
    invoiceId: options.invoiceId ?? null,
    activityCode: options.activityCode ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [timeEntry] = await db.insert(timeEntries).values(timeEntryData).returning();

  return {
    id: timeEntry.id,
    firmId: timeEntry.firmId,
    matterId: timeEntry.matterId,
    feeEarnerId: timeEntry.feeEarnerId,
    workDate: timeEntry.workDate,
    description: timeEntry.description,
    durationMinutes: timeEntry.durationMinutes,
    hourlyRate: timeEntry.hourlyRate,
    amount: timeEntry.amount,
    status: timeEntry.status,
    source: timeEntry.source,
    isBillable: timeEntry.isBillable,
    invoiceId: timeEntry.invoiceId,
  };
}

/**
 * Build time entry data without inserting into database
 */
export function buildTimeEntryData(
  firmId: string,
  matterId: string,
  feeEarnerId: string,
  options: Partial<TimeEntryFactoryOptions> = {}
): Record<string, unknown> {
  const durationMinutes = options.durationMinutes ?? 60;
  const hourlyRate = options.hourlyRate ?? "200.00";

  return {
    firmId,
    matterId,
    feeEarnerId,
    workDate: options.workDate || new Date().toISOString().split("T")[0],
    description: options.description || "Test time entry work",
    durationMinutes,
    hourlyRate,
    amount: options.amount ?? calculateAmount(durationMinutes, hourlyRate),
    status: options.status || "draft",
    source: options.source || "manual",
    isBillable: options.isBillable ?? true,
  };
}

/**
 * Create a submitted time entry (ready for approval)
 */
export async function createSubmittedTimeEntry(
  firmId: string,
  matterId: string,
  feeEarnerId: string,
  options: Partial<TimeEntryFactoryOptions> = {}
): Promise<TestTimeEntry> {
  return createTimeEntry({
    ...options,
    firmId,
    matterId,
    feeEarnerId,
    status: "submitted",
  });
}

/**
 * Create an approved time entry (ready for billing)
 */
export async function createApprovedTimeEntry(
  firmId: string,
  matterId: string,
  feeEarnerId: string,
  options: Partial<TimeEntryFactoryOptions> = {}
): Promise<TestTimeEntry> {
  return createTimeEntry({
    ...options,
    firmId,
    matterId,
    feeEarnerId,
    status: "approved",
  });
}
