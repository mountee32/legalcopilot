/**
 * Emails Integration Tests
 *
 * Tests email CRUD operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { eq, and, ilike, gte, lte, sql } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createEmail,
  createInboundEmail,
  createOutboundEmail,
  createDraftEmail,
  createSentEmail,
  createProcessedEmail,
  createManyEmails,
  createEmailThread,
} from "@tests/fixtures/factories/email";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Emails Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates an inbound email with required fields", async () => {
      const email = await createInboundEmail(ctx.firmId, {
        subject: "Question about conveyancing",
        bodyText: "Hi, I have a question about my property purchase.",
        fromAddress: { name: "John Smith", address: "john@example.com" },
        toAddresses: [{ name: "Legal Team", address: "legal@lawfirm.com" }],
      });

      expect(email.id).toBeDefined();
      expect(email.firmId).toBe(ctx.firmId);
      expect(email.direction).toBe("inbound");
      expect(email.status).toBe("received");
      expect(email.subject).toBe("Question about conveyancing");
      expect(email.bodyText).toBe("Hi, I have a question about my property purchase.");
      expect(email.fromAddress).toEqual({ name: "John Smith", address: "john@example.com" });
      expect(email.toAddresses).toEqual([{ name: "Legal Team", address: "legal@lawfirm.com" }]);
      expect(email.receivedAt).toBeDefined();
    });

    it("creates an outbound draft email", async () => {
      const email = await createDraftEmail(ctx.firmId, {
        subject: "Response to your inquiry",
        bodyText: "Thank you for your inquiry. We will review and respond shortly.",
        fromAddress: { name: "Lawyer", address: "lawyer@lawfirm.com" },
        toAddresses: [{ name: "Client", address: "client@example.com" }],
      });

      expect(email.direction).toBe("outbound");
      expect(email.status).toBe("draft");
      expect(email.sentAt).toBeNull();
      expect(email.receivedAt).toBeNull();
    });

    it("creates a sent email with timestamp", async () => {
      const sentAt = new Date();
      const email = await createSentEmail(ctx.firmId, {
        subject: "Your documents are ready",
        sentAt,
      });

      expect(email.status).toBe("sent");
      expect(email.sentAt).toBeDefined();
      expect(email.sentAt).toBeInstanceOf(Date);
    });

    it("creates email with attachments", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Documents attached",
        hasAttachments: true,
        attachmentCount: 2,
        attachmentIds: ["doc-1", "doc-2"],
      });

      expect(email.hasAttachments).toBe(true);
      expect(email.attachmentCount).toBe(2);
      expect(email.attachmentIds).toEqual(["doc-1", "doc-2"]);
    });

    it("creates email with CC and BCC addresses", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Team update",
        fromAddress: { name: "Senior Partner", address: "senior@lawfirm.com" },
        toAddresses: [{ name: "Client", address: "client@example.com" }],
        ccAddresses: [{ name: "Junior Lawyer", address: "junior@lawfirm.com" }],
        bccAddresses: [{ name: "Admin", address: "admin@lawfirm.com" }],
      });

      expect(email.ccAddresses).toEqual([{ name: "Junior Lawyer", address: "junior@lawfirm.com" }]);
      expect(email.bccAddresses).toEqual([{ name: "Admin", address: "admin@lawfirm.com" }]);
    });

    it("persists email data to database", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Persistent Email Test",
        bodyText: "This email should be stored in the database.",
        messageId: "<unique-message-id@test.com>",
      });

      const [dbEmail] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(dbEmail).toBeDefined();
      expect(dbEmail.subject).toBe("Persistent Email Test");
      expect(dbEmail.bodyText).toBe("This email should be stored in the database.");
      expect(dbEmail.messageId).toBe("<unique-message-id@test.com>");
    });
  });

  describe("Read", () => {
    it("retrieves email by ID", async () => {
      const created = await createEmail({
        firmId: ctx.firmId,
        subject: "Retrieve Test Email",
        bodyText: "Full email content here",
      });

      const [retrieved] = await db.select().from(emails).where(eq(emails.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.subject).toBe("Retrieve Test Email");
      expect(retrieved.bodyText).toBe("Full email content here");
    });

    it("lists emails for a firm", async () => {
      await createEmail({ firmId: ctx.firmId, subject: "Email 1" });
      await createEmail({ firmId: ctx.firmId, subject: "Email 2" });
      await createEmail({ firmId: ctx.firmId, subject: "Email 3" });

      const firmEmails = await db.select().from(emails).where(eq(emails.firmId, ctx.firmId));

      expect(firmEmails.length).toBeGreaterThanOrEqual(3);
    });

    it("retrieves email with all metadata", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Metadata Test",
        messageId: "<metadata-test@example.com>",
        threadId: "thread-123",
        inReplyTo: "<previous-message@example.com>",
      });

      const [retrieved] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(retrieved.messageId).toBe("<metadata-test@example.com>");
      expect(retrieved.threadId).toBe("thread-123");
      expect(retrieved.inReplyTo).toBe("<previous-message@example.com>");
    });
  });

  describe("Update", () => {
    it("updates email to link to matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Property Purchase",
      });

      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "About the property",
        matterId: undefined,
      });

      expect(email.matterId).toBeNull();

      // Link email to matter
      await db
        .update(emails)
        .set({
          matterId: matter.id,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id));

      const [updated] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(updated.matterId).toBe(matter.id);
    });

    it("marks email as read", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Unread email",
        readAt: null,
      });

      expect(email.readAt).toBeNull();

      const readAt = new Date();
      await db
        .update(emails)
        .set({
          readAt,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id));

      const [updated] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(updated.readAt).toBeDefined();
      expect(updated.readAt).toBeInstanceOf(Date);
    });

    it("updates email status", async () => {
      const email = await createDraftEmail(ctx.firmId, {
        subject: "Draft email",
      });

      expect(email.status).toBe("draft");

      await db
        .update(emails)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id));

      const [updated] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(updated.status).toBe("sent");
      expect(updated.sentAt).toBeDefined();
    });

    it("updates AI processing results", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Process this email",
        aiProcessed: false,
      });

      expect(email.aiProcessed).toBe(false);

      await db
        .update(emails)
        .set({
          aiProcessed: true,
          aiProcessedAt: new Date(),
          aiIntent: "request_information",
          aiSentiment: "neutral",
          aiUrgency: 7,
          aiSummary: "Client is requesting information about their case.",
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id));

      const [updated] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(updated.aiProcessed).toBe(true);
      expect(updated.aiProcessedAt).toBeDefined();
      expect(updated.aiIntent).toBe("request_information");
      expect(updated.aiSentiment).toBe("neutral");
      expect(updated.aiUrgency).toBe(7);
      expect(updated.aiSummary).toBe("Client is requesting information about their case.");
    });
  });

  describe("Delete (Soft)", () => {
    it("archives email by setting status to archived", async () => {
      const email = await createEmail({
        firmId: ctx.firmId,
        subject: "Archive this email",
        status: "received",
      });

      await db
        .update(emails)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id));

      const [archived] = await db.select().from(emails).where(eq(emails.id, email.id));

      expect(archived.status).toBe("archived");
    });
  });
});

describe("Emails Integration - Filtering", () => {
  const ctx = setupIntegrationSuite();

  it("filters by direction (inbound/outbound)", async () => {
    await createInboundEmail(ctx.firmId, { subject: "Inbound 1" });
    await createInboundEmail(ctx.firmId, { subject: "Inbound 2" });
    await createOutboundEmail(ctx.firmId, { subject: "Outbound 1" });

    const inbound = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.direction, "inbound")));

    const outbound = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.direction, "outbound")));

    expect(inbound.length).toBeGreaterThanOrEqual(2);
    expect(outbound.length).toBeGreaterThanOrEqual(1);
    expect(inbound.every((e) => e.direction === "inbound")).toBe(true);
    expect(outbound.every((e) => e.direction === "outbound")).toBe(true);
  });

  it("filters by status", async () => {
    await createDraftEmail(ctx.firmId, { subject: "Draft 1" });
    await createDraftEmail(ctx.firmId, { subject: "Draft 2" });
    await createSentEmail(ctx.firmId, { subject: "Sent 1" });

    const drafts = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.status, "draft")));

    const sent = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.status, "sent")));

    expect(drafts.length).toBeGreaterThanOrEqual(2);
    expect(sent.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by matter", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Matter 1",
    });
    const matter2 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Matter 2",
    });

    await createEmail({ firmId: ctx.firmId, matterId: matter1.id, subject: "Matter 1 Email 1" });
    await createEmail({ firmId: ctx.firmId, matterId: matter1.id, subject: "Matter 1 Email 2" });
    await createEmail({ firmId: ctx.firmId, matterId: matter2.id, subject: "Matter 2 Email 1" });

    const matter1Emails = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.matterId, matter1.id)));

    expect(matter1Emails.length).toBe(2);
    expect(matter1Emails.every((e) => e.matterId === matter1.id)).toBe(true);
  });

  it("filters by date range", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await createEmail({
      firmId: ctx.firmId,
      subject: "Recent email",
      receivedAt: now,
    });

    await createEmail({
      firmId: ctx.firmId,
      subject: "Yesterday email",
      receivedAt: yesterday,
    });

    await createEmail({
      firmId: ctx.firmId,
      subject: "Old email",
      receivedAt: twoDaysAgo,
    });

    // Get emails from yesterday onwards
    const recentEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          eq(emails.firmId, ctx.firmId),
          gte(emails.receivedAt, new Date(yesterday.getTime() - 1000))
        )
      );

    expect(recentEmails.length).toBeGreaterThanOrEqual(2);
  });

  it("searches by subject", async () => {
    await createEmail({
      firmId: ctx.firmId,
      subject: "UniqueSubjectSearch12345 - Important",
    });

    const results = await db
      .select()
      .from(emails)
      .where(
        and(eq(emails.firmId, ctx.firmId), ilike(emails.subject, "%UniqueSubjectSearch12345%"))
      );

    expect(results.length).toBe(1);
    expect(results[0].subject).toContain("UniqueSubjectSearch12345");
  });

  it("filters by read/unread status", async () => {
    await createEmail({ firmId: ctx.firmId, subject: "Read email", readAt: new Date() });
    await createEmail({ firmId: ctx.firmId, subject: "Unread email 1", readAt: null });
    await createEmail({ firmId: ctx.firmId, subject: "Unread email 2", readAt: null });

    const unread = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), sql`${emails.readAt} IS NULL`));

    const read = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), sql`${emails.readAt} IS NOT NULL`));

    expect(unread.length).toBeGreaterThanOrEqual(2);
    expect(read.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by AI processing status", async () => {
    await createProcessedEmail(ctx.firmId, { subject: "Processed email" });
    await createEmail({ firmId: ctx.firmId, subject: "Unprocessed email", aiProcessed: false });

    const processed = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.aiProcessed, true)));

    const unprocessed = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.aiProcessed, false)));

    expect(processed.length).toBeGreaterThanOrEqual(1);
    expect(unprocessed.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Emails Integration - Email Linking", () => {
  const ctx = setupIntegrationSuite();

  it("links email to matter", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Conveyancing Matter",
    });

    const email = await createEmail({
      firmId: ctx.firmId,
      subject: "Property documents",
      matterId: matter.id,
    });

    expect(email.matterId).toBe(matter.id);

    // Verify link in database
    const [linked] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, email.id), eq(emails.matterId, matter.id)));

    expect(linked).toBeDefined();
  });

  it("allows unlinking email from matter", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter",
    });

    const email = await createEmail({
      firmId: ctx.firmId,
      subject: "Linked email",
      matterId: matter.id,
    });

    expect(email.matterId).toBe(matter.id);

    // Unlink
    await db
      .update(emails)
      .set({
        matterId: null,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, email.id));

    const [unlinked] = await db.select().from(emails).where(eq(emails.id, email.id));

    expect(unlinked.matterId).toBeNull();
  });

  it("stores AI-suggested matter link", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "AI Matched Matter",
    });

    const email = await createEmail({
      firmId: ctx.firmId,
      subject: "Email with AI match",
      aiMatchedMatterId: matter.id,
      aiMatchConfidence: 85,
    });

    expect(email.aiMatchedMatterId).toBe(matter.id);
    expect(email.aiMatchConfidence).toBe(85);

    // Can be promoted to actual link
    await db
      .update(emails)
      .set({
        matterId: email.aiMatchedMatterId,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, email.id));

    const [promoted] = await db.select().from(emails).where(eq(emails.id, email.id));

    expect(promoted.matterId).toBe(matter.id);
  });

  it("retrieves all emails for a matter", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Multi-Email Matter",
    });

    // Create several emails for this matter
    await createEmail({ firmId: ctx.firmId, matterId: matter.id, subject: "Email 1" });
    await createEmail({ firmId: ctx.firmId, matterId: matter.id, subject: "Email 2" });
    await createEmail({ firmId: ctx.firmId, matterId: matter.id, subject: "Email 3" });

    const matterEmails = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.matterId, matter.id)));

    expect(matterEmails.length).toBe(3);
  });
});

describe("Emails Integration - Email Threads", () => {
  const ctx = setupIntegrationSuite();

  it("creates email thread with threadId", async () => {
    const thread = await createEmailThread(ctx.firmId, 3, {
      subject: "Re: Property Purchase Discussion",
    });

    expect(thread.length).toBe(3);
    expect(thread[0].threadId).toBeDefined();
    expect(thread[1].threadId).toBe(thread[0].threadId);
    expect(thread[2].threadId).toBe(thread[0].threadId);
  });

  it("links replies with inReplyTo", async () => {
    const thread = await createEmailThread(ctx.firmId, 3);

    expect(thread[0].inReplyTo).toBeNull();
    expect(thread[1].inReplyTo).toBe(thread[0].messageId);
    expect(thread[2].inReplyTo).toBe(thread[1].messageId);
  });

  it("retrieves all emails in a thread", async () => {
    const thread = await createEmailThread(ctx.firmId, 4);
    const threadId = thread[0].threadId;

    const threadEmails = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.threadId, threadId!)))
      .orderBy(emails.createdAt);

    expect(threadEmails.length).toBe(4);
  });
});

describe("Emails Integration - Pagination", () => {
  const ctx = setupIntegrationSuite();

  it("paginates results correctly", async () => {
    // Create enough emails for pagination
    await createManyEmails(ctx.firmId, 15);

    // First page
    const page1 = await db
      .select()
      .from(emails)
      .where(eq(emails.firmId, ctx.firmId))
      .limit(5)
      .offset(0);

    // Second page
    const page2 = await db
      .select()
      .from(emails)
      .where(eq(emails.firmId, ctx.firmId))
      .limit(5)
      .offset(5);

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);

    // Pages should have different emails
    const page1Ids = page1.map((e) => e.id);
    const page2Ids = page2.map((e) => e.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
});

describe("Emails Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates emails between firms", async () => {
    // Create email in first firm
    const email1 = await createEmail({
      firmId: ctx.firmId,
      subject: "Firm 1 Email",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create email in second firm
    const email2 = await createEmail({
      firmId: firm2.id,
      subject: "Firm 2 Email",
    });

    // Query emails for first firm
    const firm1Emails = await db.select().from(emails).where(eq(emails.firmId, ctx.firmId));

    // Query emails for second firm
    const firm2Emails = await db.select().from(emails).where(eq(emails.firmId, firm2.id));

    // Each firm should only see their own emails
    expect(firm1Emails.some((e) => e.id === email1.id)).toBe(true);
    expect(firm1Emails.some((e) => e.id === email2.id)).toBe(false);

    expect(firm2Emails.some((e) => e.id === email2.id)).toBe(true);
    expect(firm2Emails.some((e) => e.id === email1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(emails).where(eq(emails.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing emails from another firm by ID", async () => {
    // Create email in first firm
    const email1 = await createEmail({
      firmId: ctx.firmId,
      subject: "Isolated Email",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query email1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, email1.id), eq(emails.firmId, firm2.id)));

    // Should not find the email
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("email with matter link respects firm boundaries", async () => {
    // Create matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });

    // Create email linked to matter in first firm
    const email1 = await createEmail({
      firmId: ctx.firmId,
      matterId: matter1.id,
      subject: "Matter Email",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Cross-Firm Test Firm" });

    // Query emails for matter in wrong firm - should not find it
    const wrongFirmQuery = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, firm2.id), eq(emails.matterId, matter1.id)));

    expect(wrongFirmQuery.length).toBe(0);

    // Query in correct firm should work
    const correctFirmQuery = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.matterId, matter1.id)));

    expect(correctFirmQuery.length).toBe(1);
    expect(correctFirmQuery[0].id).toBe(email1.id);

    // Cleanup
    await db.delete(emails).where(eq(emails.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Emails Integration - AI Processing", () => {
  const ctx = setupIntegrationSuite();

  it("stores AI processing results", async () => {
    const email = await createProcessedEmail(ctx.firmId, {
      subject: "Urgent: Court deadline approaching",
      aiIntent: "deadline",
      aiSentiment: "frustrated",
      aiUrgency: 9,
      aiSummary: "Client is concerned about upcoming court deadline.",
      aiSuggestedResponse:
        "We are on track to meet the deadline. Documents will be filed tomorrow.",
      aiSuggestedTasks: [
        { task: "File documents", priority: "high" },
        { task: "Notify client", priority: "medium" },
      ],
    });

    expect(email.aiProcessed).toBe(true);
    expect(email.aiIntent).toBe("deadline");
    expect(email.aiSentiment).toBe("frustrated");
    expect(email.aiUrgency).toBe(9);
    expect(email.aiSummary).toContain("court deadline");
    expect(email.aiSuggestedResponse).toContain("on track");
    expect(email.aiSuggestedTasks).toHaveLength(2);
  });

  it("filters emails by AI intent", async () => {
    await createProcessedEmail(ctx.firmId, {
      subject: "Request for info",
      aiIntent: "request_information",
    });
    await createProcessedEmail(ctx.firmId, {
      subject: "Complaint about service",
      aiIntent: "complaint",
    });

    const infoRequests = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.aiIntent, "request_information")));

    const complaints = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.aiIntent, "complaint")));

    expect(infoRequests.length).toBeGreaterThanOrEqual(1);
    expect(complaints.length).toBeGreaterThanOrEqual(1);
  });

  it("filters emails by AI urgency threshold", async () => {
    await createProcessedEmail(ctx.firmId, { subject: "Low urgency", aiUrgency: 3 });
    await createProcessedEmail(ctx.firmId, { subject: "High urgency", aiUrgency: 9 });
    await createProcessedEmail(ctx.firmId, { subject: "Medium urgency", aiUrgency: 5 });

    // Get urgent emails (urgency >= 7)
    const urgentEmails = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), gte(emails.aiUrgency, 7)));

    expect(urgentEmails.length).toBeGreaterThanOrEqual(1);
    expect(urgentEmails.every((e) => e.aiUrgency && e.aiUrgency >= 7)).toBe(true);
  });
});

describe("Emails Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("allows multiple emails with same subject", async () => {
    const subject = "Re: Property Purchase";

    const email1 = await createEmail({ firmId: ctx.firmId, subject });
    const email2 = await createEmail({ firmId: ctx.firmId, subject });

    expect(email1.subject).toBe(subject);
    expect(email2.subject).toBe(subject);
    expect(email1.id).not.toBe(email2.id);
  });

  it("allows multiple emails with same messageId (e.g., forwarded emails)", async () => {
    const messageId = `<shared-${Date.now()}@test.com>`;

    const email1 = await createEmail({
      firmId: ctx.firmId,
      messageId,
      subject: "Original email",
    });

    const email2 = await createEmail({
      firmId: ctx.firmId,
      messageId,
      subject: "Forwarded: Original email",
    });

    // Both emails should be created successfully
    expect(email1.messageId).toBe(messageId);
    expect(email2.messageId).toBe(messageId);
    expect(email1.id).not.toBe(email2.id);
  });

  it("maintains referential integrity with matter deletion", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Temporary Matter",
    });

    const email = await createEmail({
      firmId: ctx.firmId,
      matterId: matter.id,
      subject: "Linked to matter",
    });

    expect(email.matterId).toBe(matter.id);

    // Delete the matter
    const { matters } = await import("@/lib/db/schema");
    await db.delete(matters).where(eq(matters.id, matter.id));

    // Email should still exist but matterId should be null (onDelete: set null)
    const [orphanedEmail] = await db.select().from(emails).where(eq(emails.id, email.id));

    expect(orphanedEmail).toBeDefined();
    expect(orphanedEmail.matterId).toBeNull();
  });
});
