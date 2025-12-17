/**
 * Signature Requests Integration Tests
 *
 * Tests signature request CRUD operations, workflows, and multi-signer scenarios
 * against the real database. Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { signatureRequests, documents, clients, matters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createSignatureRequest,
  createMultiSignerRequest,
  createSentSignatureRequest,
  createCompletedSignatureRequest,
  type SignerInfo,
} from "@tests/fixtures/factories/signature-request";
import { createDocument } from "@tests/fixtures/factories/document";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Signature Requests Integration - CRUD Operations", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a signature request for a document", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Contract to Sign",
        type: "contract",
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        provider: "docusign",
      });

      expect(request.id).toBeDefined();
      expect(request.firmId).toBe(ctx.firmId);
      expect(request.documentId).toBe(document.id);
      expect(request.provider).toBe("docusign");
      expect(request.status).toBe("draft");
      expect(request.signers).toBeDefined();
      expect(Array.isArray(request.signers)).toBe(true);
    });

    it("creates a signature request with Adobe Sign provider", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        provider: "adobe_sign",
      });

      expect(request.provider).toBe("adobe_sign");
    });

    it("creates a signature request with custom signer", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const signers: SignerInfo[] = [
        {
          email: "john.doe@example.com",
          name: "John Doe",
          order: 1,
          status: "pending",
          signedAt: null,
        },
      ];

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        signers,
      });

      expect(request.signers).toBeDefined();
      const requestSigners = request.signers as SignerInfo[];
      expect(requestSigners.length).toBe(1);
      expect(requestSigners[0].email).toBe("john.doe@example.com");
      expect(requestSigners[0].name).toBe("John Doe");
      expect(requestSigners[0].status).toBe("pending");
    });

    it("persists signature request data to database", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        externalId: "ext-sig-123",
      });

      const [dbRequest] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, request.id));

      expect(dbRequest).toBeDefined();
      expect(dbRequest.externalId).toBe("ext-sig-123");
      expect(dbRequest.firmId).toBe(ctx.firmId);
      expect(dbRequest.documentId).toBe(document.id);
    });
  });

  describe("Read", () => {
    it("retrieves signature request by ID", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const created = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
      });

      const [retrieved] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.documentId).toBe(document.id);
    });

    it("lists signature requests for a firm", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const doc1 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });
      const doc2 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });
      const doc3 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      await createSignatureRequest({ firmId: ctx.firmId, documentId: doc1.id });
      await createSignatureRequest({ firmId: ctx.firmId, documentId: doc2.id });
      await createSignatureRequest({ firmId: ctx.firmId, documentId: doc3.id });

      const firmRequests = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.firmId, ctx.firmId));

      expect(firmRequests.length).toBeGreaterThanOrEqual(3);
    });

    it("filters signature requests by status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const doc1 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });
      const doc2 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: doc1.id,
        status: "draft",
      });
      await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: doc2.id,
        status: "sent",
        sentAt: new Date(),
      });

      const draftRequests = await db
        .select()
        .from(signatureRequests)
        .where(
          and(eq(signatureRequests.firmId, ctx.firmId), eq(signatureRequests.status, "draft"))
        );

      const sentRequests = await db
        .select()
        .from(signatureRequests)
        .where(and(eq(signatureRequests.firmId, ctx.firmId), eq(signatureRequests.status, "sent")));

      expect(draftRequests.length).toBeGreaterThanOrEqual(1);
      expect(sentRequests.length).toBeGreaterThanOrEqual(1);
    });

    it("filters signature requests by document", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
      });

      const docRequests = await db
        .select()
        .from(signatureRequests)
        .where(
          and(
            eq(signatureRequests.firmId, ctx.firmId),
            eq(signatureRequests.documentId, document.id)
          )
        );

      expect(docRequests.length).toBeGreaterThanOrEqual(1);
      expect(docRequests[0].documentId).toBe(document.id);
    });
  });

  describe("Update", () => {
    it("updates signature request status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        status: "draft",
      });

      await db
        .update(signatureRequests)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(signatureRequests.id, request.id));

      const [updated] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, request.id));

      expect(updated.status).toBe("sent");
      expect(updated.sentAt).not.toBeNull();
    });

    it("updates signer status after signing", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const signers: SignerInfo[] = [
        {
          email: "signer@example.com",
          name: "Signer Name",
          order: 1,
          status: "pending",
          signedAt: null,
        },
      ];

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        status: "sent",
        signers,
      });

      // Update signer status
      const updatedSigners: SignerInfo[] = [
        {
          email: "signer@example.com",
          name: "Signer Name",
          order: 1,
          status: "signed",
          signedAt: new Date().toISOString(),
        },
      ];

      await db
        .update(signatureRequests)
        .set({
          signers: updatedSigners,
          updatedAt: new Date(),
        })
        .where(eq(signatureRequests.id, request.id));

      const [updated] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, request.id));

      const finalSigners = updated.signers as SignerInfo[];
      expect(finalSigners[0].status).toBe("signed");
      expect(finalSigners[0].signedAt).not.toBeNull();
    });

    it("links signed document to signature request", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Original Document",
      });
      const signedDocument = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Signed Document",
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        status: "sent",
      });

      await db
        .update(signatureRequests)
        .set({
          status: "completed",
          completedAt: new Date(),
          signedDocumentId: signedDocument.id,
          updatedAt: new Date(),
        })
        .where(eq(signatureRequests.id, request.id));

      const [updated] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, request.id));

      expect(updated.status).toBe("completed");
      expect(updated.completedAt).not.toBeNull();
      expect(updated.signedDocumentId).toBe(signedDocument.id);
    });
  });

  describe("Delete", () => {
    it("voids signature request by updating status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
        status: "sent",
      });

      await db
        .update(signatureRequests)
        .set({ status: "voided", updatedAt: new Date() })
        .where(eq(signatureRequests.id, request.id));

      const [voided] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, request.id));

      expect(voided.status).toBe("voided");
    });

    it("hard deletes signature request from database", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const request = await createSignatureRequest({
        firmId: ctx.firmId,
        documentId: document.id,
      });

      await db.delete(signatureRequests).where(eq(signatureRequests.id, request.id));

      const result = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.id, request.id));

      expect(result.length).toBe(0);
    });
  });
});

describe("Signature Requests Integration - Signature Workflow", () => {
  const ctx = setupIntegrationSuite();

  it("tracks signature request from draft to sent", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    // Create draft request
    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      status: "draft",
    });

    expect(request.status).toBe("draft");
    expect(request.sentAt).toBeNull();

    // Send the request
    await db
      .update(signatureRequests)
      .set({
        status: "sent",
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(signatureRequests.id, request.id));

    const [sent] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(sent.status).toBe("sent");
    expect(sent.sentAt).not.toBeNull();
  });

  it("tracks signature request through to completion", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });
    const signedDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Signed Version",
    });

    // Create sent request
    const request = await createSentSignatureRequest(ctx.firmId, document.id);

    expect(request.status).toBe("sent");
    expect(request.completedAt).toBeNull();

    // Complete the request
    const signers: SignerInfo[] = [
      {
        email: "signer@example.com",
        name: "Test Signer",
        order: 1,
        status: "signed",
        signedAt: new Date().toISOString(),
      },
    ];

    await db
      .update(signatureRequests)
      .set({
        status: "completed",
        completedAt: new Date(),
        signedDocumentId: signedDoc.id,
        signers,
        updatedAt: new Date(),
      })
      .where(eq(signatureRequests.id, request.id));

    const [completed] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(completed.status).toBe("completed");
    expect(completed.completedAt).not.toBeNull();
    expect(completed.signedDocumentId).toBe(signedDoc.id);
  });

  it("handles declined signature request", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const request = await createSentSignatureRequest(ctx.firmId, document.id);

    // Decline the request
    const signers: SignerInfo[] = [
      {
        email: "signer@example.com",
        name: "Test Signer",
        order: 1,
        status: "declined",
        signedAt: null,
      },
    ];

    await db
      .update(signatureRequests)
      .set({
        status: "declined",
        signers,
        updatedAt: new Date(),
      })
      .where(eq(signatureRequests.id, request.id));

    const [declined] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(declined.status).toBe("declined");
    const declinedSigners = declined.signers as SignerInfo[];
    expect(declinedSigners[0].status).toBe("declined");
  });

  it("tracks delivered status before signing", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const request = await createSentSignatureRequest(ctx.firmId, document.id);

    // Mark as delivered
    await db
      .update(signatureRequests)
      .set({ status: "delivered", updatedAt: new Date() })
      .where(eq(signatureRequests.id, request.id));

    const [delivered] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(delivered.status).toBe("delivered");
  });
});

describe("Signature Requests Integration - Multiple Signers", () => {
  const ctx = setupIntegrationSuite();

  it("creates signature request with multiple signers", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const request = await createMultiSignerRequest(ctx.firmId, document.id, 3);

    const signers = request.signers as SignerInfo[];
    expect(signers.length).toBe(3);
    expect(signers[0].order).toBe(1);
    expect(signers[1].order).toBe(2);
    expect(signers[2].order).toBe(3);
  });

  it("tracks per-signer status independently", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const signers: SignerInfo[] = [
      {
        email: "signer1@example.com",
        name: "Signer One",
        order: 1,
        status: "pending",
        signedAt: null,
      },
      {
        email: "signer2@example.com",
        name: "Signer Two",
        order: 2,
        status: "pending",
        signedAt: null,
      },
    ];

    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      status: "sent",
      signers,
    });

    // First signer signs
    const updatedSigners: SignerInfo[] = [
      {
        email: "signer1@example.com",
        name: "Signer One",
        order: 1,
        status: "signed",
        signedAt: new Date().toISOString(),
      },
      {
        email: "signer2@example.com",
        name: "Signer Two",
        order: 2,
        status: "pending",
        signedAt: null,
      },
    ];

    await db
      .update(signatureRequests)
      .set({ signers: updatedSigners, updatedAt: new Date() })
      .where(eq(signatureRequests.id, request.id));

    const [updated] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    const finalSigners = updated.signers as SignerInfo[];
    expect(finalSigners[0].status).toBe("signed");
    expect(finalSigners[1].status).toBe("pending");
  });

  it("completes multi-signer request when all sign", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });
    const signedDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Fully Signed",
    });

    const signers: SignerInfo[] = [
      {
        email: "signer1@example.com",
        name: "Signer One",
        order: 1,
        status: "pending",
        signedAt: null,
      },
      {
        email: "signer2@example.com",
        name: "Signer Two",
        order: 2,
        status: "pending",
        signedAt: null,
      },
    ];

    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      status: "sent",
      signers,
    });

    // All signers sign
    const allSigned: SignerInfo[] = [
      {
        email: "signer1@example.com",
        name: "Signer One",
        order: 1,
        status: "signed",
        signedAt: new Date().toISOString(),
      },
      {
        email: "signer2@example.com",
        name: "Signer Two",
        order: 2,
        status: "signed",
        signedAt: new Date().toISOString(),
      },
    ];

    await db
      .update(signatureRequests)
      .set({
        status: "completed",
        completedAt: new Date(),
        signedDocumentId: signedDoc.id,
        signers: allSigned,
        updatedAt: new Date(),
      })
      .where(eq(signatureRequests.id, request.id));

    const [completed] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(completed.status).toBe("completed");
    const completedSigners = completed.signers as SignerInfo[];
    expect(completedSigners.every((s) => s.status === "signed")).toBe(true);
  });

  it("respects signing order", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const signers: SignerInfo[] = [
      {
        email: "first@example.com",
        name: "First Signer",
        order: 1,
        status: "pending",
        signedAt: null,
      },
      {
        email: "second@example.com",
        name: "Second Signer",
        order: 2,
        status: "pending",
        signedAt: null,
      },
      {
        email: "third@example.com",
        name: "Third Signer",
        order: 3,
        status: "pending",
        signedAt: null,
      },
    ];

    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      status: "sent",
      signers,
    });

    const requestSigners = request.signers as SignerInfo[];
    expect(requestSigners[0].order).toBe(1);
    expect(requestSigners[1].order).toBe(2);
    expect(requestSigners[2].order).toBe(3);
  });
});

describe("Signature Requests Integration - Document Integration", () => {
  const ctx = setupIntegrationSuite();

  it("links signature request to source document", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Source Contract",
      type: "contract",
    });

    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
    });

    expect(request.documentId).toBe(document.id);

    // Verify relationship in database
    const [dbRequest] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(dbRequest.documentId).toBe(document.id);
  });

  it("stores signed document reference on completion", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const sourceDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Unsigned Contract",
    });
    const signedDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Signed Contract",
      status: "approved",
    });

    const request = await createCompletedSignatureRequest(ctx.firmId, sourceDoc.id, signedDoc.id);

    expect(request.documentId).toBe(sourceDoc.id);
    expect(request.signedDocumentId).toBe(signedDoc.id);
    expect(request.status).toBe("completed");
  });

  it("maintains both source and signed document references", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const sourceDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Original",
    });
    const signedDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Signed",
    });

    const request = await createCompletedSignatureRequest(ctx.firmId, sourceDoc.id, signedDoc.id);

    // Verify both documents exist and are linked
    const [sourceDocument] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, sourceDoc.id));

    const [signedDocument] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, signedDoc.id));

    expect(sourceDocument).toBeDefined();
    expect(signedDocument).toBeDefined();
    expect(request.documentId).toBe(sourceDocument.id);
    expect(request.signedDocumentId).toBe(signedDocument.id);
  });

  it("allows multiple signature requests for same document", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    // Create two signature requests for the same document
    const request1 = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      provider: "docusign",
    });
    const request2 = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      provider: "adobe_sign",
    });

    expect(request1.documentId).toBe(document.id);
    expect(request2.documentId).toBe(document.id);
    expect(request1.id).not.toBe(request2.id);
  });
});

describe("Signature Requests Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates signature requests between firms", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });
    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
    });

    const request1 = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: doc1.id,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
    });
    const doc2 = await createDocument({
      firmId: firm2.id,
      matterId: matter2.id,
    });

    const request2 = await createSignatureRequest({
      firmId: firm2.id,
      documentId: doc2.id,
    });

    // Query requests for first firm
    const firm1Requests = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.firmId, ctx.firmId));

    // Query requests for second firm
    const firm2Requests = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.firmId, firm2.id));

    // Each firm should only see their own requests
    expect(firm1Requests.some((r) => r.id === request1.id)).toBe(true);
    expect(firm1Requests.some((r) => r.id === request2.id)).toBe(false);

    expect(firm2Requests.some((r) => r.id === request2.id)).toBe(true);
    expect(firm2Requests.some((r) => r.id === request1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(signatureRequests).where(eq(signatureRequests.firmId, firm2.id));
    await db.delete(documents).where(eq(documents.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing signature requests from another firm by ID", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });
    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
    });

    const request1 = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: doc1.id,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query request1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(signatureRequests)
      .where(
        and(
          eq(signatureRequests.id, request1.id),
          eq(signatureRequests.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find the request
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Signature Requests Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("cascades delete from document to signature requests", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
    });

    // Verify request exists
    const requestsBefore = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.documentId, document.id));

    expect(requestsBefore.length).toBe(1);

    // Delete the document
    await db.delete(documents).where(eq(documents.id, document.id));

    // Requests should be deleted due to cascade
    const requestsAfter = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.documentId, document.id));

    expect(requestsAfter.length).toBe(0);
  });

  it("handles null signed document reference gracefully", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });

    const request = await createSignatureRequest({
      firmId: ctx.firmId,
      documentId: document.id,
      signedDocumentId: null,
    });

    expect(request.signedDocumentId).toBeNull();

    const [dbRequest] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(dbRequest.signedDocumentId).toBeNull();
  });

  it("sets signed document to null when signed document is deleted", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const sourceDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
    });
    const signedDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Signed",
    });

    const request = await createCompletedSignatureRequest(ctx.firmId, sourceDoc.id, signedDoc.id);

    expect(request.signedDocumentId).toBe(signedDoc.id);

    // Delete the signed document
    await db.delete(documents).where(eq(documents.id, signedDoc.id));

    // Signature request should still exist but with null signed document
    const [updated] = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.id, request.id));

    expect(updated).toBeDefined();
    expect(updated.signedDocumentId).toBeNull();
  });
});
