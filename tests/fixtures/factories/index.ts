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

// Intake
export * from "./lead";
export * from "./quote";

// Documents
export * from "./document";
export * from "./template";

// Billing
export * from "./time-entry";
export * from "./invoice";
export * from "./payment";

// Calendar & Tasks
export * from "./calendar-event";
export * from "./task";

// Approvals
export * from "./approval-request";

// Conflicts
export * from "./conflict";

// Integrations
export * from "./integration-accounts";
export * from "./signature-request";

// Notifications
export * from "./notification";

// Pipeline
export * from "./pipeline";

// Re-export all factories as a namespace for convenience
import * as firmFactory from "./firm";
import * as userFactory from "./user";
import * as roleFactory from "./role";
import * as clientFactory from "./client";
import * as matterFactory from "./matter";
import * as leadFactory from "./lead";
import * as quoteFactory from "./quote";
import * as documentFactory from "./document";
import * as templateFactory from "./template";
import * as timeEntryFactory from "./time-entry";
import * as invoiceFactory from "./invoice";
import * as paymentFactory from "./payment";
import * as calendarEventFactory from "./calendar-event";
import * as taskFactory from "./task";
import * as approvalRequestFactory from "./approval-request";
import * as conflictFactory from "./conflict";
import * as integrationAccountsFactory from "./integration-accounts";
import * as signatureRequestFactory from "./signature-request";
import * as notificationFactory from "./notification";
import * as pipelineFactory from "./pipeline";

export const factories = {
  ...firmFactory,
  ...userFactory,
  ...roleFactory,
  ...clientFactory,
  ...matterFactory,
  ...leadFactory,
  ...quoteFactory,
  ...documentFactory,
  ...templateFactory,
  ...timeEntryFactory,
  ...invoiceFactory,
  ...paymentFactory,
  ...calendarEventFactory,
  ...taskFactory,
  ...approvalRequestFactory,
  ...conflictFactory,
  ...integrationAccountsFactory,
  ...signatureRequestFactory,
  ...notificationFactory,
  ...pipelineFactory,
};
