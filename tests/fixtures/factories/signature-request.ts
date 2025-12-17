/**
 * Signature Request factory for creating test signature requests
 */
import { db } from "@/lib/db";
import { signatureRequests } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type SignatureRequestStatus =
  | "draft"
  | "pending_approval"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided"
  | "failed";

export type SignatureProvider = "docusign" | "adobe_sign";

export interface SignerInfo {
  email: string;
  name: string;
  order?: number;
  status?: "pending" | "signed" | "declined";
  signedAt?: string | null;
}

export interface SignatureRequestFactoryOptions {
  id?: string;
  firmId: string;
  documentId: string;
  provider?: SignatureProvider;
  externalId?: string | null;
  status?: SignatureRequestStatus;
  signers?: SignerInfo[];
  sentAt?: Date | null;
  completedAt?: Date | null;
  signedDocumentId?: string | null;
  createdById?: string | null;
}

export interface TestSignatureRequest {
  id: string;
  firmId: string;
  documentId: string;
  provider: string;
  externalId: string | null;
  status: string;
  signers: any;
  sentAt: Date | null;
  completedAt: Date | null;
  signedDocumentId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a test signature request in the database
 */
export async function createSignatureRequest(
  options: SignatureRequestFactoryOptions
): Promise<TestSignatureRequest> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const requestData = {
    id,
    firmId: options.firmId,
    documentId: options.documentId,
    provider: options.provider || "docusign",
    externalId: options.externalId ?? `ext-${randomUUID()}`,
    status: options.status || "draft",
    signers: options.signers || [
      {
        email: `signer-${suffix}@example.com`,
        name: `Test Signer ${suffix}`,
        order: 1,
        status: "pending",
        signedAt: null,
      },
    ],
    sentAt: options.sentAt ?? null,
    completedAt: options.completedAt ?? null,
    signedDocumentId: options.signedDocumentId ?? null,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [request] = await db.insert(signatureRequests).values(requestData).returning();

  return {
    id: request.id,
    firmId: request.firmId,
    documentId: request.documentId,
    provider: request.provider,
    externalId: request.externalId,
    status: request.status,
    signers: request.signers,
    sentAt: request.sentAt,
    completedAt: request.completedAt,
    signedDocumentId: request.signedDocumentId,
    createdById: request.createdById,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

/**
 * Create a signature request with multiple signers
 */
export async function createMultiSignerRequest(
  firmId: string,
  documentId: string,
  signerCount: number,
  options: Partial<SignatureRequestFactoryOptions> = {}
): Promise<TestSignatureRequest> {
  const suffix = Date.now().toString(36);
  const signers: SignerInfo[] = [];

  for (let i = 0; i < signerCount; i++) {
    signers.push({
      email: `signer${i + 1}-${suffix}@example.com`,
      name: `Signer ${i + 1}`,
      order: i + 1,
      status: "pending",
      signedAt: null,
    });
  }

  return createSignatureRequest({
    ...options,
    firmId,
    documentId,
    signers,
  });
}

/**
 * Create a signature request that's been sent
 */
export async function createSentSignatureRequest(
  firmId: string,
  documentId: string,
  options: Partial<SignatureRequestFactoryOptions> = {}
): Promise<TestSignatureRequest> {
  return createSignatureRequest({
    ...options,
    firmId,
    documentId,
    status: "sent",
    sentAt: new Date(),
  });
}

/**
 * Create a completed signature request
 */
export async function createCompletedSignatureRequest(
  firmId: string,
  documentId: string,
  signedDocumentId: string,
  options: Partial<SignatureRequestFactoryOptions> = {}
): Promise<TestSignatureRequest> {
  const suffix = Date.now().toString(36);
  const signers: SignerInfo[] = [
    {
      email: `signer-${suffix}@example.com`,
      name: `Test Signer ${suffix}`,
      order: 1,
      status: "signed",
      signedAt: new Date().toISOString(),
    },
  ];

  return createSignatureRequest({
    ...options,
    firmId,
    documentId,
    status: "completed",
    signers,
    sentAt: new Date(Date.now() - 86400000), // 1 day ago
    completedAt: new Date(),
    signedDocumentId,
  });
}
