/**
 * Generation Context Builder
 *
 * Builds a structured context for document generation by querying
 * matter, client, firm, fee earner, and pipeline findings data.
 * Shared by both findings export and template-based generation.
 */

import { eq, and, desc } from "drizzle-orm";
import { matters, clients, firms, users, pipelineFindings } from "@/lib/db/schema";
import { NotFoundError } from "@/middleware/withErrorHandler";
import type { db } from "@/lib/db";

export interface FindingEntry {
  id: string;
  fieldKey: string;
  label: string;
  value: string;
  confidence: number;
  impact: string;
  status: string;
  sourceQuote: string | null;
  categoryKey: string;
  pageStart: number | null;
  pageEnd: number | null;
}

export interface GenerationContext {
  matter: {
    id: string;
    reference: string;
    title: string;
    practiceArea: string;
    status: string;
    description: string | null;
    subType: string | null;
  };
  client: {
    name: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    type: string;
    email: string | null;
    phone: string | null;
    address: string;
  };
  firm: {
    name: string;
  };
  feeEarner: {
    name: string;
    email: string;
  } | null;
  findings: Record<string, string>;
  findingsByCategory: Record<string, FindingEntry[]>;
  statusCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    auto_applied: number;
    conflict: number;
  };
  today: string;
}

function formatClientName(client: {
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}): string {
  if (client.type === "individual") {
    return [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown Client";
  }
  return client.companyName || "Unknown Client";
}

function formatAddress(client: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
}): string {
  return [client.addressLine1, client.addressLine2, client.city, client.county, client.postcode]
    .filter(Boolean)
    .join(", ");
}

export async function buildGenerationContext(
  firmId: string,
  matterId: string,
  tx: typeof db
): Promise<GenerationContext> {
  // Fetch matter with client
  const [matterRow] = await tx
    .select()
    .from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)));

  if (!matterRow) throw new NotFoundError("Matter not found");

  const [clientRow] = await tx.select().from(clients).where(eq(clients.id, matterRow.clientId));

  if (!clientRow) throw new NotFoundError("Client not found");

  const [firmRow] = await tx.select().from(firms).where(eq(firms.id, firmId));

  let feeEarner = null;
  if (matterRow.feeEarnerId) {
    const [userRow] = await tx
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, matterRow.feeEarnerId));
    if (userRow) {
      feeEarner = { name: userRow.name, email: userRow.email };
    }
  }

  // Fetch all findings for the matter, newest first
  const allFindings = await tx
    .select()
    .from(pipelineFindings)
    .where(and(eq(pipelineFindings.matterId, matterId), eq(pipelineFindings.firmId, firmId)))
    .orderBy(desc(pipelineFindings.createdAt));

  // Flatten findings by fieldKey (latest value wins — already ordered by desc createdAt)
  const findingsFlat: Record<string, string> = {};
  const findingsByCategory: Record<string, FindingEntry[]> = {};
  const statusCounts = { pending: 0, accepted: 0, rejected: 0, auto_applied: 0, conflict: 0 };

  for (const f of allFindings) {
    const status = f.status as keyof typeof statusCounts;
    if (status in statusCounts) statusCounts[status]++;

    const entry: FindingEntry = {
      id: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      value: f.value,
      confidence: parseFloat(String(f.confidence)),
      impact: f.impact,
      status: f.status,
      sourceQuote: f.sourceQuote,
      categoryKey: f.categoryKey,
      pageStart: f.pageStart,
      pageEnd: f.pageEnd,
    };

    if (!findingsFlat[f.fieldKey]) {
      findingsFlat[f.fieldKey] = f.value;
    }

    if (!findingsByCategory[f.categoryKey]) {
      findingsByCategory[f.categoryKey] = [];
    }
    findingsByCategory[f.categoryKey].push(entry);
  }

  const now = new Date();
  const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

  return {
    matter: {
      id: matterRow.id,
      reference: matterRow.reference,
      title: matterRow.title,
      practiceArea: matterRow.practiceArea,
      status: matterRow.status,
      description: matterRow.description,
      subType: matterRow.subType,
    },
    client: {
      name: formatClientName(clientRow),
      firstName: clientRow.firstName,
      lastName: clientRow.lastName,
      companyName: clientRow.companyName,
      type: clientRow.type,
      email: clientRow.email,
      phone: clientRow.phone,
      address: formatAddress(clientRow),
    },
    firm: {
      name: firmRow?.name || "Unknown Firm",
    },
    feeEarner,
    findings: findingsFlat,
    findingsByCategory,
    statusCounts,
    today,
  };
}
