import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { clients, leads, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ConvertLeadSchema } from "@/lib/api/schemas";
import { generateReference } from "@/lib/references";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("intake:write")(async (request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Lead not found");

      const body = await request.json().catch(() => ({}));
      const data = ConvertLeadSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [lead] = await tx
          .select()
          .from(leads)
          .where(and(eq(leads.id, id), eq(leads.firmId, firmId)))
          .limit(1);

        if (!lead) throw new NotFoundError("Lead not found");

        if (lead.convertedToClientId) {
          const [existingMatter] = await tx
            .select({ id: matters.id })
            .from(matters)
            .where(and(eq(matters.clientId, lead.convertedToClientId), eq(matters.firmId, firmId)))
            .orderBy(matters.createdAt)
            .limit(1);

          if (!existingMatter)
            throw new ValidationError("Lead already converted but matter missing");
          return { clientId: lead.convertedToClientId, matterId: existingMatter.id };
        }

        const reference = generateReference("CLI");
        const clientId = lead.convertedToClientId ?? null;

        const [client] = await tx
          .insert(clients)
          .values({
            firmId,
            reference,
            type: data.clientType,
            status: "active",
            firstName: lead.firstName ?? null,
            lastName: lead.lastName ?? null,
            companyName: lead.companyName ?? null,
            email: lead.email ?? null,
            phone: lead.phone ?? null,
            country: "United Kingdom",
            notes: lead.notes ?? null,
          })
          .returning({ id: clients.id });

        if (!client) throw new ValidationError("Failed to create client");

        const matterRef = generateReference("MAT");
        const [matter] = await tx
          .insert(matters)
          .values({
            firmId,
            reference: matterRef,
            title: data.matterTitle,
            description: null,
            clientId: client.id,
            feeEarnerId: user.user.id,
            supervisorId: null,
            practiceArea: data.practiceArea,
            billingType: "hourly",
            status: "lead",
            updatedAt: new Date(),
          })
          .returning({ id: matters.id });

        if (!matter) throw new ValidationError("Failed to create matter");

        await tx
          .update(leads)
          .set({ convertedToClientId: client.id, status: "won", updatedAt: new Date() })
          .where(and(eq(leads.id, id), eq(leads.firmId, firmId)));

        await createTimelineEvent(tx, {
          firmId,
          matterId: matter.id,
          type: "lead_converted",
          title: "Lead converted to matter",
          actorType: "user",
          actorId: user.user.id,
          entityType: "lead",
          entityId: id,
          occurredAt: new Date(),
          metadata: { clientId: client.id },
        });

        return { clientId: client.id, matterId: matter.id };
      });

      return NextResponse.json({ success: true, ...result });
    })
  )
);
