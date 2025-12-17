/**
 * Test Factories
 *
 * Convenient factory functions for creating test data.
 *
 * @example
 * import { factories } from "@tests/fixtures/factories";
 *
 * const firm = await factories.createFirm();
 * const user = await factories.createUser({ firmId: firm.id });
 * const client = await factories.createClient({ firmId: firm.id });
 * const matter = await factories.createMatter({
 *   firmId: firm.id,
 *   clientId: client.id
 * });
 * const timeEntry = await factories.createTimeEntry({
 *   firmId: firm.id,
 *   matterId: matter.id,
 *   feeEarnerId: user.id
 * });
 */

// Core entities
export * from "./firm";
export * from "./user";
export * from "./role";
export * from "./client";
export * from "./matter";

// Documents
export * from "./document";

// Billing
export * from "./time-entry";
export * from "./invoice";
export * from "./payment";

// Calendar & Tasks
export * from "./calendar-event";
export * from "./task";

// Approvals
export * from "./approval-request";

// Re-export all factories as a namespace for convenience
import * as firmFactory from "./firm";
import * as userFactory from "./user";
import * as roleFactory from "./role";
import * as clientFactory from "./client";
import * as matterFactory from "./matter";
import * as documentFactory from "./document";
import * as timeEntryFactory from "./time-entry";
import * as invoiceFactory from "./invoice";
import * as paymentFactory from "./payment";
import * as calendarEventFactory from "./calendar-event";
import * as taskFactory from "./task";
import * as approvalRequestFactory from "./approval-request";

export const factories = {
  ...firmFactory,
  ...userFactory,
  ...roleFactory,
  ...clientFactory,
  ...matterFactory,
  ...documentFactory,
  ...timeEntryFactory,
  ...invoiceFactory,
  ...paymentFactory,
  ...calendarEventFactory,
  ...taskFactory,
  ...approvalRequestFactory,
};
