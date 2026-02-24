import { db } from "@/lib/db";
import { emailAccounts, emailImports } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import { daysAgo } from "../types";
import type { SeederContext } from "../types";

export async function seedEmailImports(ctx: SeederContext) {
  console.log("  Creating email import demo data...");

  // ---------------------------------------------------------------------------
  // Demo email account (Microsoft, connected, James Clarke)
  // ---------------------------------------------------------------------------

  await db
    .insert(emailAccounts)
    .values({
      id: DEMO_IDS.emailAccountsDemo.jamesClarke,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate2,
      provider: "microsoft",
      emailAddress: "james.clarke@harrisonclark.demo",
      externalAccountId: "demo-ms-account-001",
      scopes: ["Mail.Read", "Mail.ReadWrite"],
      tokens: {
        access_token: "demo_access_token",
        refresh_token: "demo_refresh_token",
        expires_at: Date.now() + 3600 * 1000,
      },
      webhookSecret: "demo_webhook_secret_001",
      status: "connected",
      lastSyncAt: daysAgo(0),
    })
    .onConflictDoUpdate({
      target: [emailAccounts.id],
      set: { status: "connected", lastSyncAt: daysAgo(0), updatedAt: new Date() },
    });

  // ---------------------------------------------------------------------------
  // Email import records
  // ---------------------------------------------------------------------------

  const importsData = [
    // 1. Completed — subject_reference match (conveyancing matter)
    {
      id: DEMO_IDS.emailImports.imp1,
      firmId: DEMO_IDS.firm,
      emailAccountId: DEMO_IDS.emailAccountsDemo.jamesClarke,
      externalMessageId: "demo-msg-001@outlook.com",
      externalThreadId: "demo-thread-001",
      fromAddress: "agent@solicitorsfirm.co.uk",
      subject: "RE: MAT-DEMO-001 — Search results enclosed",
      receivedAt: daysAgo(3),
      matterId: DEMO_IDS.matters.conveyancing,
      matchMethod: "subject_reference" as const,
      matchConfidence: "98",
      status: "completed" as const,
      attachmentCount: 2,
      documentsCreated: [DEMO_IDS.documents.doc29, DEMO_IDS.documents.doc30],
      pipelineRunIds: [DEMO_IDS.pipelineRuns.convRun1],
      emailId: DEMO_IDS.emails.email11,
      processedAt: daysAgo(3),
    },

    // 2. Completed — sender_domain match (litigation matter)
    {
      id: DEMO_IDS.emailImports.imp2,
      firmId: DEMO_IDS.firm,
      emailAccountId: DEMO_IDS.emailAccountsDemo.jamesClarke,
      externalMessageId: "demo-msg-002@outlook.com",
      externalThreadId: "demo-thread-002",
      fromAddress: "mark.johnson@acmecorp.demo",
      subject: "Updated financial projections for the case",
      receivedAt: daysAgo(2),
      matterId: DEMO_IDS.matters.litigation,
      matchMethod: "sender_domain" as const,
      matchConfidence: "85",
      status: "completed" as const,
      attachmentCount: 1,
      documentsCreated: [DEMO_IDS.documents.doc28],
      pipelineRunIds: null,
      emailId: DEMO_IDS.emails.email12,
      processedAt: daysAgo(2),
    },

    // 3. Unmatched — no matter link
    {
      id: DEMO_IDS.emailImports.imp3,
      firmId: DEMO_IDS.firm,
      emailAccountId: DEMO_IDS.emailAccountsDemo.jamesClarke,
      externalMessageId: "demo-msg-003@outlook.com",
      externalThreadId: "demo-thread-003",
      fromAddress: "unknown.sender@newclient.example",
      subject: "Initial enquiry about property dispute",
      receivedAt: daysAgo(1),
      matterId: null,
      matchMethod: null,
      matchConfidence: null,
      status: "unmatched" as const,
      attachmentCount: 1,
      documentsCreated: null,
      pipelineRunIds: null,
      emailId: DEMO_IDS.emails.email13,
      processedAt: daysAgo(1),
    },

    // 4. Failed — processing error
    {
      id: DEMO_IDS.emailImports.imp4,
      firmId: DEMO_IDS.firm,
      emailAccountId: DEMO_IDS.emailAccountsDemo.jamesClarke,
      externalMessageId: "demo-msg-004@outlook.com",
      externalThreadId: "demo-thread-004",
      fromAddress: "court@hmcts.justice.gov.uk",
      subject: "FW: Hearing notification — Case HQ-2024-001234",
      receivedAt: daysAgo(1),
      matterId: DEMO_IDS.matters.litigation,
      matchMethod: "sender_domain" as const,
      matchConfidence: "70",
      status: "failed" as const,
      attachmentCount: 3,
      documentsCreated: null,
      pipelineRunIds: null,
      emailId: null,
      error: "Attachment download timed out after 30s",
      processedAt: daysAgo(1),
    },

    // 5. Matched — no attachments, no pipeline needed
    {
      id: DEMO_IDS.emailImports.imp5,
      firmId: DEMO_IDS.firm,
      emailAccountId: DEMO_IDS.emailAccountsDemo.jamesClarke,
      externalMessageId: "demo-msg-005@outlook.com",
      externalThreadId: "demo-thread-005",
      fromAddress: "sarah.chen@taylors.demo",
      subject: "RE: MAT-DEMO-008 — Medical appointment confirmed",
      receivedAt: daysAgo(0),
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      matchMethod: "subject_reference" as const,
      matchConfidence: "98",
      status: "matched" as const,
      attachmentCount: 0,
      documentsCreated: null,
      pipelineRunIds: null,
      emailId: DEMO_IDS.emails.email14,
      processedAt: daysAgo(0),
    },
  ];

  for (const imp of importsData) {
    await db
      .insert(emailImports)
      .values(imp)
      .onConflictDoUpdate({
        target: [emailImports.id],
        set: {
          status: imp.status,
          matterId: imp.matterId,
          matchMethod: imp.matchMethod,
          matchConfidence: imp.matchConfidence,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`    ✓ 1 email account, ${importsData.length} email imports`);
}
