/**
 * Relative Due Date Calculation
 *
 * Calculates due dates based on relative day offsets from anchor dates.
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

export type DueDateRelativeTo =
  | "stage_started"
  | "task_created"
  | "matter_created"
  | "matter_opened";

export interface CalculateDueDateParams {
  /** Number of days from the reference date */
  relativeDays: number;
  /** What the due date is relative to */
  relativeTo: DueDateRelativeTo;
  /** The reference date to calculate from */
  referenceDate: Date;
  /** Matter created date (for matter_created) */
  matterCreatedAt?: Date;
  /** Matter opened date (for matter_opened) */
  matterOpenedAt?: Date;
  /** Stage started date (for stage_started) */
  stageStartedAt?: Date;
}

/**
 * Calculate a due date based on relative days from an anchor date.
 *
 * @returns The calculated due date, or null if the reference date is not available
 */
export function calculateDueDate(params: CalculateDueDateParams): Date | null {
  const {
    relativeDays,
    relativeTo,
    referenceDate,
    matterCreatedAt,
    matterOpenedAt,
    stageStartedAt,
  } = params;

  let anchorDate: Date;

  switch (relativeTo) {
    case "task_created":
      anchorDate = referenceDate;
      break;

    case "matter_created":
      if (!matterCreatedAt) {
        // Fall back to reference date if matter created date not provided
        anchorDate = referenceDate;
      } else {
        anchorDate = matterCreatedAt;
      }
      break;

    case "matter_opened":
      if (!matterOpenedAt) {
        // Fall back to matter created or reference date
        anchorDate = matterCreatedAt ?? referenceDate;
      } else {
        anchorDate = matterOpenedAt;
      }
      break;

    case "stage_started":
      if (!stageStartedAt) {
        // Fall back to reference date - stage hasn't started yet
        anchorDate = referenceDate;
      } else {
        anchorDate = stageStartedAt;
      }
      break;

    default:
      anchorDate = referenceDate;
  }

  // Calculate due date by adding relative days
  const dueDate = new Date(anchorDate);
  dueDate.setDate(dueDate.getDate() + relativeDays);

  return dueDate;
}

/**
 * Calculate business days (excluding weekends) from a reference date.
 * Useful for SLA-based due dates.
 */
export function calculateBusinessDays(referenceDate: Date, businessDays: number): Date {
  const result = new Date(referenceDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Check if a due date is overdue.
 */
export function isDueOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date() > dueDate;
}

/**
 * Get the number of days until a due date (negative if overdue).
 */
export function getDaysUntilDue(dueDate: Date | null): number | null {
  if (!dueDate) return null;

  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
