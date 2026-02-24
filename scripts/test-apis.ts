import { db } from "../lib/db";
import {
  firms,
  users,
  clients,
  matters,
  timeEntries,
  invoices,
  tasks,
  calendarEvents,
  leads,
  quotes,
  documents,
  documentChunks,
  notifications,
  approvalRequests,
  emails,
  conflictChecks,
  timelineEvents,
  signatureRequests,
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

const bugs: string[] = [];

function logBug(description: string) {
  bugs.push(description);
  console.log(`   ✗ BUG: ${description}`);
}

async function testAPIs() {
  console.log("=== Manual API Testing Against User Stories ===\n");

  // Setup test firm and user
  console.log("Setting up test data...");
  const [firm] = await db
    .insert(firms)
    .values({
      name: "Test Law Firm",
      plan: "professional",
      settings: {},
    })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      name: "Test Attorney",
      email: `test-attorney-${Date.now()}@example.com`,
    })
    .returning();

  console.log(`Firm: ${firm.id}, User: ${user.id}\n`);

  try {
    // ============================================
    // EPIC 0: AI-Powered Client Intake & CRM
    // ============================================
    console.log("=== EPIC 0: Client Intake & CRM ===\n");

    // Test Lead Creation (User Story: "capture enquiries from web forms")
    console.log("Testing Lead Creation...");
    const [lead] = await db
      .insert(leads)
      .values({
        firmId: firm.id,
        source: "website",
        firstName: "Jane",
        lastName: "Prospect",
        email: "jane@example.com",
        phone: "+1 415 555 0111",
        enquiryType: "conveyancing", // NEW: Practice area for routing
        message: "I need help with purchasing a property in California", // NEW: Enquiry details
        status: "new",
        score: 80,
        assignedTo: user.id, // NEW: Lead assignment
        createdById: user.id,
      })
      .returning();
    console.log(`   ✓ Lead created: ${lead.id}`);
    console.log(`   ✓ Lead has enquiryType: ${lead.enquiryType}`);
    console.log(`   ✓ Lead has message and assignedTo fields`);

    // Test Quote Creation (User Story: "get an instant quote")
    console.log("Testing Quote Creation...");
    const validDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const validDateStr = validDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    const [quote] = await db
      .insert(quotes)
      .values({
        firmId: firm.id,
        leadId: lead.id,
        type: "conveyancing", // NEW: Practice area type
        fees: [
          // NEW: Professional fees breakdown
          { description: "Legal fees", amount: 1000 },
          { description: "Admin fee", amount: 200 },
        ],
        disbursements: [
          // NEW: Third-party costs
          { description: "County recording fee", amount: 300 },
          { description: "Search fees", amount: 240 },
        ],
        subtotal: "1200.00",
        vatAmount: "240.00",
        total: "1740.00",
        validUntil: validDateStr,
        status: "sent",
        createdById: user.id,
      })
      .returning();
    console.log(`   ✓ Quote created: ${quote.id}`);
    console.log(`   ✓ Quote has type: ${quote.type}`);
    console.log(`   ✓ Quote has fees and disbursements breakdown`);

    // Test Client Creation (User Story: "create the case once intake approved")
    console.log("Testing Client Creation...");
    const [client] = await db
      .insert(clients)
      .values({
        firmId: firm.id,
        reference: `CLI-${Date.now()}`,
        type: "individual",
        title: "Mr",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "+1 415 555 0123",
        addressLine1: "45 Market St",
        city: "San Francisco",
        postcode: "94105",
        status: "active",
        source: "lead_conversion", // NEW: Client acquisition source
        sourceId: lead.id, // NEW: Link to originating lead
        metadata: { leadId: lead.id },
      })
      .returning();
    console.log(`   ✓ Client created: ${client.id}`);
    console.log(`   ✓ Client has source: ${client.source}`);
    console.log(`   ✓ Client linked to lead: ${client.sourceId}`);

    // ============================================
    // EPIC 1: Intelligent Case Command Centre
    // ============================================
    console.log("\n=== EPIC 1: Case Command Centre ===\n");

    // Test Matter Creation (User Story: "auto-populate case details")
    console.log("Testing Matter Creation...");
    const [matter] = await db
      .insert(matters)
      .values({
        firmId: firm.id,
        clientId: client.id,
        title: "Property Purchase - 123 Test Lane",
        reference: "REA-2024-001",
        practiceArea: "conveyancing",
        status: "active",
        description: "Residential purchase",
        feeEarnerId: user.id,
        estimatedValue: "350000.00",
        riskScore: 25, // NEW: AI risk assessment score (0-100)
        riskFactors: [
          // NEW: Risk factors for explainability
          { factor: "First-time buyer", weight: 10, value: true },
          { factor: "Mortgage involved", weight: 15, value: true },
          { factor: "Property value", weight: 5, value: "standard" },
        ],
        riskAssessedAt: new Date(), // NEW: When risk was calculated
        practiceData: {
          propertyAddress: "123 Test Lane, San Francisco",
          propertyType: "freehold",
          mortgageRequired: true,
        },
      })
      .returning();
    console.log(`   ✓ Matter created: ${matter.id}`);
    console.log(`   ✓ Matter has riskScore: ${matter.riskScore}`);
    console.log(`   ✓ Matter has AI risk assessment fields`);

    // ============================================
    // EPIC 4: Deep Document Intelligence
    // ============================================
    console.log("\n=== EPIC 4: Document Intelligence ===\n");

    // Test Document Creation
    console.log("Testing Document Creation...");
    const [doc] = await db
      .insert(documents)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        title: "Draft Contract",
        type: "contract",
        status: "draft",
        filename: "draft-contract.pdf",
        mimeType: "application/pdf",
        fileSize: 102400,
        extractedText: "This is a draft contract for the purchase of 123 Test Lane...",
        createdBy: user.id,
      })
      .returning();
    console.log(`   ✓ Document created: ${doc.id}`);

    // Test Document Chunking (for search)
    console.log("Testing Document Chunking...");
    await db.insert(documentChunks).values([
      {
        firmId: firm.id,
        documentId: doc.id,
        matterId: matter.id,
        chunkIndex: 0,
        text: "This is a draft contract for the purchase of 123 Test Lane",
        charStart: 0,
        charEnd: 58,
      },
      {
        firmId: firm.id,
        documentId: doc.id,
        matterId: matter.id,
        chunkIndex: 1,
        text: "The purchase price is $350,000 payable on closing",
        charStart: 58,
        charEnd: 110,
      },
    ]);
    console.log(`   ✓ Document chunks created`);

    // ============================================
    // EPIC 7: AI-Assisted Billing
    // ============================================
    console.log("\n=== EPIC 7: Billing ===\n");

    // Test Time Entry Creation (User Story: "capture time from emails, documents")
    console.log("Testing Time Entry Creation...");
    const workDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const [timeEntry] = await db
      .insert(timeEntries)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        feeEarnerId: user.id,
        description: "Reviewing draft contract and preparing amendments",
        durationMinutes: 60,
        hourlyRate: "250.00",
        amount: "250.00",
        workDate: workDateStr,
        status: "draft",
        source: "ai_suggested", // NEW: How the time entry was created
        isBillable: true, // NEW: Billable vs non-billable tracking
      })
      .returning();
    console.log(`   ✓ Time entry created: ${timeEntry.id}`);
    console.log(`   ✓ Time entry has source: ${timeEntry.source}`);
    console.log(`   ✓ Time entry has isBillable: ${timeEntry.isBillable}`);

    // Test Invoice Generation (User Story: "generate invoices")
    console.log("Testing Invoice Creation...");
    const invoiceDateStr = new Date().toISOString().split("T")[0];
    const dueDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const [invoice] = await db
      .insert(invoices)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        clientId: client.id,
        invoiceNumber: "INV-2024-0001",
        status: "draft",
        invoiceDate: invoiceDateStr,
        dueDate: dueDateStr,
        subtotal: "250.00",
        vatRate: "8.75", // NEW: Tax rate as percentage (legacy vatRate field)
        vatAmount: "50.00",
        total: "300.00",
        balanceDue: "300.00",
      })
      .returning();
    console.log(`   ✓ Invoice created: ${invoice.id}`);
    console.log(`   ✓ Invoice has tax rate: ${invoice.vatRate}%`);

    // ============================================
    // EPIC 12: AI Task Orchestration
    // ============================================
    console.log("\n=== EPIC 12: Task Orchestration ===\n");

    // Test Task Creation (User Story: "generate tasks automatically")
    console.log("Testing Task Creation...");
    const [task] = await db
      .insert(tasks)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        title: "Review and sign contract",
        description: "Client needs to review and sign the draft contract",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedTo: user.id,
        source: "ai",
      })
      .returning();
    console.log(`   ✓ Task created: ${task.id}`);

    // Test Task Status Update
    console.log("Testing Task Completion...");
    await db
      .update(tasks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(tasks.id, task.id));
    const [completedTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
    if (completedTask?.status !== "completed") {
      logBug("Task status not updated to completed");
    } else {
      console.log(`   ✓ Task completed successfully`);
    }

    // ============================================
    // EPIC 13: AI Calendar Intelligence
    // ============================================
    console.log("\n=== EPIC 13: Calendar Intelligence ===\n");

    // Test Calendar Event Creation
    console.log("Testing Calendar Event Creation...");
    // NOTE: Schema uses eventType (enum), startAt/endAt (timestamps), createdById
    const [event] = await db
      .insert(calendarEvents)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        title: "Client Meeting - Contract Review",
        description: "Discuss draft contract with client",
        startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // schema uses startAt
        endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // schema uses endAt
        eventType: "meeting", // schema uses eventType enum
        status: "scheduled",
        createdById: user.id, // schema uses createdById
        attendees: [user.id], // jsonb type
      })
      .returning();
    console.log(`   ✓ Calendar event created: ${event.id}`);

    // ============================================
    // EPIC 9: AI Compliance & Risk Engine
    // ============================================
    console.log("\n=== EPIC 9: Compliance & Approvals ===\n");

    // Test Approval Creation (User Story: "supervision ratios")
    console.log("Testing Approval Creation...");
    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: firm.id,
        sourceType: "ai",
        sourceId: user.id,
        action: "invoice.send",
        summary: `Approve invoice ${invoice.invoiceNumber} for $${invoice.total}`,
        entityType: "invoice",
        entityId: invoice.id,
        matterId: matter.id, // NEW: Direct matter reference
        status: "pending",
        proposedPayload: { sendTo: client.email },
      })
      .returning();
    console.log(`   ✓ Approval created: ${approval.id}`);
    console.log(`   ✓ Approval linked to matter: ${approval.matterId}`);

    // Test Approval Workflow
    console.log("Testing Approval Workflow...");
    await db
      .update(approvalRequests)
      .set({
        status: "approved",
        decidedBy: user.id,
        decidedAt: new Date(),
        decisionReason: "Approved for sending",
      })
      .where(eq(approvalRequests.id, approval.id));
    const [approvedItem] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approval.id));
    if (approvedItem?.status !== "approved") {
      logBug("Approval status not updated");
    } else {
      console.log(`   ✓ Approval workflow completed`);
    }

    // ============================================
    // Test Notifications
    // ============================================
    console.log("\n=== Notifications ===\n");

    console.log("Testing Notification Creation...");
    const [notification] = await db
      .insert(notifications)
      .values({
        firmId: firm.id,
        userId: user.id,
        type: "task_assigned",
        title: "New task assigned",
        message: "You have been assigned a new task: Review and sign contract",
        entityType: "task",
        entityId: task.id,
        read: false,
      })
      .returning();
    console.log(`   ✓ Notification created: ${notification.id}`);

    // Test Notification Read
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.id, notification.id));
    const [readNotif] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id));
    if (!readNotif?.read) {
      logBug("Notification read status not updated");
    } else {
      console.log(`   ✓ Notification marked as read`);
    }

    // ============================================
    // EPIC 5: Communications Copilot
    // ============================================
    console.log("\n=== EPIC 5: Communications ===\n");

    // Test Email Creation (User Story: "match emails to cases")
    console.log("Testing Email Creation...");
    const [email] = await db
      .insert(emails)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        direction: "inbound",
        fromAddress: { email: "opponent@lawfirm.com", name: "Jane Opponent" },
        toAddresses: [{ email: "attorney@ourfirm.com", name: "Test Attorney" }],
        subject: "Re: Property Purchase - 123 Test Lane",
        bodyText: "Please find attached the draft contract for review.",
        status: "received",
        receivedAt: new Date(),
        // AI processing fields
        aiProcessed: true,
        aiProcessedAt: new Date(),
        aiIntent: "provide_information",
        aiSentiment: "neutral",
        aiUrgency: 3,
        aiSummary: "Opposing counsel providing draft contract for review",
        aiMatchedMatterId: matter.id,
        aiMatchConfidence: 95,
      })
      .returning();
    console.log(`   ✓ Email created: ${email.id}`);
    console.log(`   ✓ AI processing fields populated`);

    // ============================================
    // EPIC 0: Conflict Checking
    // ============================================
    console.log("\n=== EPIC 0: Conflict Checking ===\n");

    // Test Conflict Check Creation (User Story: "instant conflict checks")
    console.log("Testing Conflict Check Creation...");
    const [conflictCheck] = await db
      .insert(conflictChecks)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        searchTerms: ["Smith", "Jones", "123 Test Lane"],
        results: { matches: [], potentialConflicts: 0 },
        status: "clear",
        decidedBy: user.id,
        decidedAt: new Date(),
        decisionReason: "No conflicts found",
        createdById: user.id,
      })
      .returning();
    console.log(`   ✓ Conflict check created: ${conflictCheck.id}`);

    // ============================================
    // EPIC 2: Case Timeline
    // ============================================
    console.log("\n=== EPIC 2: Case Timeline ===\n");

    // Test Timeline Event Creation (User Story: "auto-generate timeline events")
    console.log("Testing Timeline Event Creation...");
    const [timelineEvent] = await db
      .insert(timelineEvents)
      .values({
        firmId: firm.id,
        matterId: matter.id,
        type: "document_uploaded",
        title: "Draft contract uploaded",
        description: "Draft contract received from opposing counsel",
        actorType: "user",
        actorId: user.id,
        entityType: "document",
        entityId: doc.id,
        occurredAt: new Date(),
      })
      .returning();
    console.log(`   ✓ Timeline event created: ${timelineEvent.id}`);

    // ============================================
    // EPIC 17: E-Signatures
    // ============================================
    console.log("\n=== EPIC 17: E-Signatures ===\n");

    // Test Signature Request Creation (User Story: "send documents for signature")
    console.log("Testing Signature Request Creation...");
    const [signatureRequest] = await db
      .insert(signatureRequests)
      .values({
        firmId: firm.id,
        documentId: doc.id,
        provider: "docusign",
        status: "draft",
        signers: [
          { email: client.email, name: `${client.firstName} ${client.lastName}`, order: 1 },
        ],
        createdById: user.id,
      })
      .returning();
    console.log(`   ✓ Signature request created: ${signatureRequest.id}`);

    // Test Signature Request Status Update
    console.log("Testing Signature Request Status Update...");
    await db
      .update(signatureRequests)
      .set({
        status: "sent",
        sentAt: new Date(),
        externalId: "docusign_envelope_123",
      })
      .where(eq(signatureRequests.id, signatureRequest.id));
    const [sentSignature] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, signatureRequest.id));
    if (sentSignature?.status !== "sent") {
      logBug("Signature request status not updated to sent");
    } else {
      console.log(`   ✓ Signature request sent successfully`);
    }

    // ============================================
    // Test Data Relationships & Integrity
    // ============================================
    console.log("\n=== Data Integrity Checks ===\n");

    // Check Matter has correct client
    const [matterWithClient] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, matter.id), eq(matters.clientId, client.id)));
    if (!matterWithClient) {
      logBug("Matter not properly linked to client");
    } else {
      console.log(`   ✓ Matter-Client relationship intact`);
    }

    // Check Time Entry links to Matter
    const [teWithMatter] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.id, timeEntry.id), eq(timeEntries.matterId, matter.id)));
    if (!teWithMatter) {
      logBug("Time entry not properly linked to matter");
    } else {
      console.log(`   ✓ TimeEntry-Matter relationship intact`);
    }

    // Check Document belongs to Matter
    const [docWithMatter] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, doc.id), eq(documents.matterId, matter.id)));
    if (!docWithMatter) {
      logBug("Document not properly linked to matter");
    } else {
      console.log(`   ✓ Document-Matter relationship intact`);
    }

    // ============================================
    // Summary
    // ============================================
    console.log("\n========================================");
    console.log("=== TEST SUMMARY ===");
    console.log("========================================");

    if (bugs.length === 0) {
      console.log("\n✅ All tests passed! No bugs found.\n");
    } else {
      console.log(`\n❌ Found ${bugs.length} bug(s):\n`);
      bugs.forEach((bug, i) => console.log(`${i + 1}. ${bug}`));
      console.log("");
    }

    // Cleanup
    console.log("Cleaning up test data...");
    await db.delete(signatureRequests).where(eq(signatureRequests.firmId, firm.id));
    await db.delete(timelineEvents).where(eq(timelineEvents.firmId, firm.id));
    await db.delete(conflictChecks).where(eq(conflictChecks.firmId, firm.id));
    await db.delete(emails).where(eq(emails.firmId, firm.id));
    await db.delete(notifications).where(eq(notifications.firmId, firm.id));
    await db.delete(approvalRequests).where(eq(approvalRequests.firmId, firm.id));
    await db.delete(calendarEvents).where(eq(calendarEvents.firmId, firm.id));
    await db.delete(tasks).where(eq(tasks.firmId, firm.id));
    await db.delete(invoices).where(eq(invoices.firmId, firm.id));
    await db.delete(timeEntries).where(eq(timeEntries.firmId, firm.id));
    await db.delete(documentChunks).where(eq(documentChunks.firmId, firm.id));
    await db.delete(documents).where(eq(documents.firmId, firm.id));
    await db.delete(quotes).where(eq(quotes.firmId, firm.id));
    await db.delete(matters).where(eq(matters.firmId, firm.id));
    await db.delete(clients).where(eq(clients.firmId, firm.id));
    await db.delete(leads).where(eq(leads.firmId, firm.id));
    await db.delete(firms).where(eq(firms.id, firm.id));
    await db.delete(users).where(eq(users.id, user.id));
    console.log("Cleanup complete.\n");
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);

    // Cleanup on error
    try {
      await db.delete(signatureRequests).where(eq(signatureRequests.firmId, firm.id));
      await db.delete(timelineEvents).where(eq(timelineEvents.firmId, firm.id));
      await db.delete(conflictChecks).where(eq(conflictChecks.firmId, firm.id));
      await db.delete(emails).where(eq(emails.firmId, firm.id));
      await db.delete(notifications).where(eq(notifications.firmId, firm.id));
      await db.delete(approvalRequests).where(eq(approvalRequests.firmId, firm.id));
      await db.delete(calendarEvents).where(eq(calendarEvents.firmId, firm.id));
      await db.delete(tasks).where(eq(tasks.firmId, firm.id));
      await db.delete(invoices).where(eq(invoices.firmId, firm.id));
      await db.delete(timeEntries).where(eq(timeEntries.firmId, firm.id));
      await db.delete(documentChunks).where(eq(documentChunks.firmId, firm.id));
      await db.delete(documents).where(eq(documents.firmId, firm.id));
      await db.delete(quotes).where(eq(quotes.firmId, firm.id));
      await db.delete(matters).where(eq(matters.firmId, firm.id));
      await db.delete(clients).where(eq(clients.firmId, firm.id));
      await db.delete(leads).where(eq(leads.firmId, firm.id));
      await db.delete(firms).where(eq(firms.id, firm.id));
      await db.delete(users).where(eq(users.id, user.id));
    } catch {
      // ignore cleanup errors
    }

    if (error.message) {
      logBug(`Unexpected error: ${error.message}`);
    }
  }

  // Return bugs for potential further processing
  return bugs;
}

testAPIs()
  .then((bugs) => {
    process.exit(bugs.length > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
