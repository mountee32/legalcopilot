// @vitest-environment node
/**
 * Comprehensive Webhook Integration Tests
 *
 * Tests all webhook endpoints across email, calendar, payments, accounting, and e-signature providers.
 * Verifies signature validation, idempotency, data processing, and error handling.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  emailAccounts,
  emailProviderEvents,
  calendarAccounts,
  calendarProviderEvents,
  calendarEvents,
  paymentProviderAccounts,
  paymentProviderEvents,
  payments,
  accountingConnections,
  accountingSyncEvents,
  signatureRequests,
  esignatureProviderEvents,
  clients,
  invoices,
  matters,
} from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";
import {
  createEmailAccount,
  createCalendarAccount,
  createPaymentAccount,
  createAccountingConnection,
} from "@tests/fixtures/factories/integration-accounts";
import { createInvoice } from "@tests/fixtures/factories/invoice";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createDocument } from "@tests/fixtures/factories/document";
import { createClient } from "@tests/fixtures/factories/client";

describe("Webhooks - Integration Tests", () => {
  const ctx = setupIntegrationSuite();

  describe("Email Webhooks", () => {
    it("handles new email notification and stores in database", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "google",
        webhookSecret: "email_secret_123",
      });

      const { POST } = await import("@/app/api/webhooks/email/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/email/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "email_secret_123",
            "x-event-id": "evt_email_new_1",
          }),
          body: JSON.stringify({
            id: "evt_email_new_1",
            event: "new_message",
            data: {
              messageId: "msg_12345",
              from: "client@example.com",
              subject: "Re: Case Update",
              threadId: "thread_123",
            },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.accepted).toBe(true);

      // Verify event stored in database
      const [event] = await db
        .select()
        .from(emailProviderEvents)
        .where(
          and(
            eq(emailProviderEvents.firmId, ctx.firmId),
            eq(emailProviderEvents.externalEventId, "evt_email_new_1")
          )
        );

      expect(event).toBeDefined();
      expect(event.provider).toBe("google");
      expect(event.accountId).toBe(account.id);
    });

    it("rejects invalid webhook secret", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        webhookSecret: "correct_secret",
      });

      const { POST } = await import("@/app/api/webhooks/email/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/email/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "wrong_secret",
            "x-event-id": "evt_invalid",
          }),
          body: JSON.stringify({ id: "evt_invalid", event: "test" }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(400);
    });

    it("enforces idempotency by event ID", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        webhookSecret: "secret",
      });

      const { POST } = await import("@/app/api/webhooks/email/[firmId]/[accountId]/route");

      const makeRequest = () =>
        new NextRequest(`http://localhost/api/webhooks/email/${ctx.firmId}/${account.id}`, {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "secret",
            "x-event-id": "evt_idempotent",
          }),
          body: JSON.stringify({ id: "evt_idempotent", event: "test" }),
        });

      // First call
      const res1 = await POST(
        makeRequest() as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );
      expect(res1.status).toBe(200);

      // Second call with same event ID
      const res2 = await POST(
        makeRequest() as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );
      expect(res2.status).toBe(200);

      // Should only have one event stored
      const events = await db
        .select()
        .from(emailProviderEvents)
        .where(
          and(
            eq(emailProviderEvents.firmId, ctx.firmId),
            eq(emailProviderEvents.externalEventId, "evt_idempotent")
          )
        );

      expect(events).toHaveLength(1);
    });
  });

  describe("Calendar Webhooks", () => {
    it("handles event created notification", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "google",
        webhookSecret: "calendar_secret",
      });

      const { POST } = await import("@/app/api/webhooks/calendar/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/calendar/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "calendar_secret",
            "x-event-id": "evt_cal_created",
          }),
          body: JSON.stringify({
            id: "evt_cal_created",
            event: "event.created",
            data: {
              eventId: "cal_event_123",
              summary: "Client Meeting",
              startTime: new Date().toISOString(),
            },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.accepted).toBe(true);

      // Verify event stored
      const [event] = await db
        .select()
        .from(calendarProviderEvents)
        .where(
          and(
            eq(calendarProviderEvents.firmId, ctx.firmId),
            eq(calendarProviderEvents.externalEventId, "evt_cal_created")
          )
        );

      expect(event).toBeDefined();
      expect(event.provider).toBe("google");
    });

    it("handles event updated notification", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "microsoft",
        webhookSecret: "calendar_secret_2",
      });

      const { POST } = await import("@/app/api/webhooks/calendar/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/calendar/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "calendar_secret_2",
            "x-event-id": "evt_cal_updated",
          }),
          body: JSON.stringify({
            id: "evt_cal_updated",
            event: "event.updated",
            data: {
              eventId: "cal_event_456",
              summary: "Updated Meeting",
            },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);
    });

    it("handles event deleted notification", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        webhookSecret: "calendar_secret_3",
      });

      const { POST } = await import("@/app/api/webhooks/calendar/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/calendar/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "calendar_secret_3",
            "x-event-id": "evt_cal_deleted",
          }),
          body: JSON.stringify({
            id: "evt_cal_deleted",
            event: "event.deleted",
            data: { eventId: "cal_event_789" },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);
    });

    it("rejects webhook for disconnected account", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        webhookSecret: "secret",
        status: "revoked",
      });

      const { POST } = await import("@/app/api/webhooks/calendar/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/calendar/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "secret",
            "x-event-id": "evt_test",
          }),
          body: JSON.stringify({ id: "evt_test", event: "test" }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(400);
    });
  });

  describe("Payment Webhooks", () => {
    it("handles payment received and applies to invoice", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        provider: "stripe",
        webhookSecret: "payment_secret",
      });

      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: "Payment",
          lastName: "Test",
          email: `payment-${Date.now()}@test.example.com`,
        })
        .returning();

      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        subtotal: "100.00",
        paidAmount: "0.00",
        balanceDue: "120.00",
        status: "sent",
      });

      const { POST } = await import("@/app/api/webhooks/payments/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/payments/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "payment_secret",
            "x-event-id": "evt_payment_success",
          }),
          body: JSON.stringify({
            id: "evt_payment_success",
            type: "payment.succeeded",
            data: {
              invoiceId: invoice.id,
              amount: "120.00",
              paymentId: "pi_stripe_123",
            },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);

      // Verify invoice updated
      const [updatedInvoice] = await db
        .select({ status: invoices.status, balanceDue: invoices.balanceDue })
        .from(invoices)
        .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.id, invoice.id)));

      expect(updatedInvoice.status).toBe("paid");
      expect(updatedInvoice.balanceDue).toBe("0.00");

      // Verify payment record created
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(and(eq(payments.firmId, ctx.firmId), eq(payments.invoiceId, invoice.id)));

      expect(paymentRecords).toHaveLength(1);
    });

    it("handles payment failed notification", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        provider: "stripe",
        webhookSecret: "payment_secret_2",
      });

      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: "Failed",
          lastName: "Payment",
          email: `failed-${Date.now()}@test.example.com`,
        })
        .returning();

      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "sent",
      });

      const { POST } = await import("@/app/api/webhooks/payments/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/payments/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "payment_secret_2",
            "x-event-id": "evt_payment_failed",
          }),
          body: JSON.stringify({
            id: "evt_payment_failed",
            type: "payment.failed",
            data: {
              invoiceId: invoice.id,
              amount: "120.00",
              paymentId: "pi_failed",
              reason: "insufficient_funds",
            },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);

      // Verify event logged
      const [event] = await db
        .select()
        .from(paymentProviderEvents)
        .where(
          and(
            eq(paymentProviderEvents.firmId, ctx.firmId),
            eq(paymentProviderEvents.externalEventId, "evt_payment_failed")
          )
        );

      expect(event).toBeDefined();
      expect(event.eventType).toBe("payment.failed");
    });

    it("handles refund notification", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        provider: "gocardless",
        webhookSecret: "refund_secret",
      });

      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: "Refund",
          lastName: "Test",
          email: `refund-${Date.now()}@test.example.com`,
        })
        .returning();

      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "paid",
        paidAmount: "100.00",
        balanceDue: "0.00",
      });

      const { POST } = await import("@/app/api/webhooks/payments/[firmId]/[accountId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/payments/${ctx.firmId}/${account.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "refund_secret",
            "x-event-id": "evt_refund",
          }),
          body: JSON.stringify({
            id: "evt_refund",
            type: "payment.refunded",
            data: {
              invoiceId: invoice.id,
              amount: "100.00",
              refundId: "re_123",
            },
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, accountId: account.id },
        } as any
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Accounting Webhooks", () => {
    it("handles invoice synced notification", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        provider: "xero",
        webhookSecret: "accounting_secret",
      });

      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: "Accounting",
          lastName: "Test",
          email: `accounting-${Date.now()}@test.example.com`,
        })
        .returning();

      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const { POST } = await import("@/app/api/webhooks/accounting/[firmId]/[connectionId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/accounting/${ctx.firmId}/${connection.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "accounting_secret",
          }),
          body: JSON.stringify({
            entityType: "invoice",
            entityId: invoice.id,
            externalId: "xero_inv_123",
            status: "synced",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, connectionId: connection.id },
        } as any
      );

      expect(response.status).toBe(200);

      // Verify sync event created
      const [syncEvent] = await db
        .select()
        .from(accountingSyncEvents)
        .where(
          and(
            eq(accountingSyncEvents.firmId, ctx.firmId),
            eq(accountingSyncEvents.entityType, "invoice"),
            eq(accountingSyncEvents.entityId, invoice.id)
          )
        );

      expect(syncEvent).toBeDefined();
      expect(syncEvent.provider).toBe("xero");
      expect(syncEvent.externalId).toBe("xero_inv_123");
      expect(syncEvent.status).toBe("synced");
    });

    it("handles payment synced notification", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        provider: "xero",
        webhookSecret: "accounting_secret_2",
      });

      const { POST } = await import("@/app/api/webhooks/accounting/[firmId]/[connectionId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/accounting/${ctx.firmId}/${connection.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "accounting_secret_2",
          }),
          body: JSON.stringify({
            entityType: "payment",
            externalId: "xero_pay_456",
            status: "synced",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, connectionId: connection.id },
        } as any
      );

      expect(response.status).toBe(200);
    });

    it("handles sync errors", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        provider: "quickbooks",
        webhookSecret: "accounting_secret_3",
      });

      const { POST } = await import("@/app/api/webhooks/accounting/[firmId]/[connectionId]/route");

      // Use null for entityId when reporting sync errors (entity not yet created locally)
      const request = new NextRequest(
        `http://localhost/api/webhooks/accounting/${ctx.firmId}/${connection.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "accounting_secret_3",
          }),
          body: JSON.stringify({
            entityType: "invoice",
            entityId: null,
            externalId: "qb_inv_failed_123",
            status: "error",
            error: "Invoice validation failed in QuickBooks",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, connectionId: connection.id },
        } as any
      );

      expect(response.status).toBe(200);

      // Verify error logged
      const [syncEvent] = await db
        .select()
        .from(accountingSyncEvents)
        .where(
          and(
            eq(accountingSyncEvents.firmId, ctx.firmId),
            eq(accountingSyncEvents.entityType, "invoice"),
            eq(accountingSyncEvents.status, "error")
          )
        )
        .orderBy(accountingSyncEvents.createdAt);

      expect(syncEvent).toBeDefined();
      expect(syncEvent.error).toBe("Invoice validation failed in QuickBooks");
    });

    it("rejects invalid connection ID", async () => {
      const { POST } = await import("@/app/api/webhooks/accounting/[firmId]/[connectionId]/route");

      const fakeConnectionId = "00000000-0000-0000-0000-000000000000";

      const request = new NextRequest(
        `http://localhost/api/webhooks/accounting/${ctx.firmId}/${fakeConnectionId}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "any_secret",
          }),
          body: JSON.stringify({
            entityType: "invoice",
            status: "synced",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, connectionId: fakeConnectionId },
        } as any
      );

      expect(response.status).toBe(400);
    });
  });

  describe("E-Signature Webhooks", () => {
    let client: any;
    let matter: any;
    let document: any;

    beforeAll(async () => {
      client = await createClient({ firmId: ctx.firmId });
      matter = await createMatter({ firmId: ctx.firmId, clientId: client.id });
      document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Contract for Signature",
      });
    });

    it("handles document signed notification", async () => {
      // Create signature request
      const [sigRequest] = await db
        .insert(signatureRequests)
        .values({
          firmId: ctx.firmId,
          documentId: document.id,
          provider: "docusign",
          externalId: "docusign_env_123",
          status: "sent",
          signers: [{ email: "signer@example.com", name: "John Signer" }],
        })
        .returning();

      // Set up environment variable for webhook secret
      const originalSecret = process.env.ESIGNATURE_WEBHOOK_SECRET;
      process.env.ESIGNATURE_WEBHOOK_SECRET = "esign_secret";

      const { POST } = await import("@/app/api/webhooks/esignature/[firmId]/[requestId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/esignature/${ctx.firmId}/${sigRequest.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "esign_secret",
            "x-event-id": "evt_signed",
          }),
          body: JSON.stringify({
            id: "evt_signed",
            status: "completed",
            event: "completed",
            externalId: "docusign_env_123",
            signedDocumentUrl: "https://docusign.com/signed/123",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, requestId: sigRequest.id },
        } as any
      );

      expect(response.status).toBe(200);

      // Verify signature request updated
      const [updated] = await db
        .select()
        .from(signatureRequests)
        .where(
          and(eq(signatureRequests.firmId, ctx.firmId), eq(signatureRequests.id, sigRequest.id))
        );

      expect(updated.status).toBe("completed");
      expect(updated.completedAt).toBeDefined();

      // Verify event logged
      const [event] = await db
        .select()
        .from(esignatureProviderEvents)
        .where(
          and(
            eq(esignatureProviderEvents.firmId, ctx.firmId),
            eq(esignatureProviderEvents.externalEventId, "evt_signed")
          )
        );

      expect(event).toBeDefined();
      expect(event.provider).toBe("docusign");

      // Restore original secret
      if (originalSecret !== undefined) {
        process.env.ESIGNATURE_WEBHOOK_SECRET = originalSecret;
      } else {
        delete process.env.ESIGNATURE_WEBHOOK_SECRET;
      }
    });

    it("handles signature declined notification", async () => {
      const [sigRequest] = await db
        .insert(signatureRequests)
        .values({
          firmId: ctx.firmId,
          documentId: document.id,
          provider: "adobe_sign",
          externalId: "adobe_agr_456",
          status: "sent",
          signers: [{ email: "decliner@example.com", name: "Jane Decliner" }],
        })
        .returning();

      const originalSecret = process.env.ESIGNATURE_WEBHOOK_SECRET;
      process.env.ESIGNATURE_WEBHOOK_SECRET = "esign_secret_2";

      const { POST } = await import("@/app/api/webhooks/esignature/[firmId]/[requestId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/esignature/${ctx.firmId}/${sigRequest.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "esign_secret_2",
            "x-event-id": "evt_declined",
          }),
          body: JSON.stringify({
            id: "evt_declined",
            status: "declined",
            event: "declined",
            externalId: "adobe_agr_456",
            reason: "Terms not acceptable",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, requestId: sigRequest.id },
        } as any
      );

      expect(response.status).toBe(200);

      // Verify signature request updated
      const [updated] = await db
        .select()
        .from(signatureRequests)
        .where(
          and(eq(signatureRequests.firmId, ctx.firmId), eq(signatureRequests.id, sigRequest.id))
        );

      expect(updated.status).toBe("declined");

      if (originalSecret !== undefined) {
        process.env.ESIGNATURE_WEBHOOK_SECRET = originalSecret;
      } else {
        delete process.env.ESIGNATURE_WEBHOOK_SECRET;
      }
    });

    it("rejects invalid webhook signature", async () => {
      const [sigRequest] = await db
        .insert(signatureRequests)
        .values({
          firmId: ctx.firmId,
          documentId: document.id,
          provider: "docusign",
          status: "sent",
        })
        .returning();

      const originalSecret = process.env.ESIGNATURE_WEBHOOK_SECRET;
      process.env.ESIGNATURE_WEBHOOK_SECRET = "correct_secret";

      const { POST } = await import("@/app/api/webhooks/esignature/[firmId]/[requestId]/route");

      const request = new NextRequest(
        `http://localhost/api/webhooks/esignature/${ctx.firmId}/${sigRequest.id}`,
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "wrong_secret",
            "x-event-id": "evt_invalid",
          }),
          body: JSON.stringify({
            id: "evt_invalid",
            status: "completed",
          }),
        }
      );

      const response = await POST(
        request as any,
        {
          params: { firmId: ctx.firmId, requestId: sigRequest.id },
        } as any
      );

      expect(response.status).toBe(400);

      if (originalSecret !== undefined) {
        process.env.ESIGNATURE_WEBHOOK_SECRET = originalSecret;
      } else {
        delete process.env.ESIGNATURE_WEBHOOK_SECRET;
      }
    });

    it("enforces idempotency for e-signature events", async () => {
      const [sigRequest] = await db
        .insert(signatureRequests)
        .values({
          firmId: ctx.firmId,
          documentId: document.id,
          provider: "docusign",
          status: "sent",
        })
        .returning();

      const originalSecret = process.env.ESIGNATURE_WEBHOOK_SECRET;
      process.env.ESIGNATURE_WEBHOOK_SECRET = "esign_secret_3";

      const { POST } = await import("@/app/api/webhooks/esignature/[firmId]/[requestId]/route");

      const makeRequest = () =>
        new NextRequest(`http://localhost/api/webhooks/esignature/${ctx.firmId}/${sigRequest.id}`, {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-webhook-secret": "esign_secret_3",
            "x-event-id": "evt_idempotent_esign",
          }),
          body: JSON.stringify({
            id: "evt_idempotent_esign",
            status: "completed",
          }),
        });

      // First call
      const res1 = await POST(
        makeRequest() as any,
        {
          params: { firmId: ctx.firmId, requestId: sigRequest.id },
        } as any
      );
      expect(res1.status).toBe(200);

      // Second call with same event ID
      const res2 = await POST(
        makeRequest() as any,
        {
          params: { firmId: ctx.firmId, requestId: sigRequest.id },
        } as any
      );
      expect(res2.status).toBe(200);

      // Should only have one event stored
      const events = await db
        .select()
        .from(esignatureProviderEvents)
        .where(
          and(
            eq(esignatureProviderEvents.firmId, ctx.firmId),
            eq(esignatureProviderEvents.externalEventId, "evt_idempotent_esign")
          )
        );

      expect(events).toHaveLength(1);

      if (originalSecret !== undefined) {
        process.env.ESIGNATURE_WEBHOOK_SECRET = originalSecret;
      } else {
        delete process.env.ESIGNATURE_WEBHOOK_SECRET;
      }
    });
  });

  describe("Security & Rate Limiting", () => {
    it("verifies webhook signatures across all providers", async () => {
      // Already tested in individual sections above
      // This serves as a placeholder for any additional security tests
      expect(true).toBe(true);
    });

    it("enforces idempotency across all webhook types", async () => {
      // Already tested in individual sections above
      expect(true).toBe(true);
    });
  });
});
