import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { emails, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateEmailSchema, EmailQuerySchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("emails:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = EmailQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(emails.firmId, firmId)];
      if (query.matterId) whereClauses.push(eq(emails.matterId, query.matterId));
      if (query.direction) whereClauses.push(eq(emails.direction, query.direction));
      if (query.status) whereClauses.push(eq(emails.status, query.status));
      if (typeof query.aiProcessed === "boolean")
        whereClauses.push(eq(emails.aiProcessed, query.aiProcessed));
      if (query.search) whereClauses.push(ilike(emails.subject, `%${query.search}%`));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(emails)
          .where(where);

        const rows = await tx
          .select()
          .from(emails)
          .where(where)
          .orderBy(desc(emails.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        emails: rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("emails:write")(async (request: NextRequest, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateEmailSchema.parse(body);

      const row = await withFirmDb(firmId, async (tx) => {
        if (data.matterId) {
          const [matter] = await tx
            .select({ id: matters.id })
            .from(matters)
            .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
            .limit(1);
          if (!matter) throw new NotFoundError("Matter not found");
        }

        const attachmentCount = data.attachmentIds?.length ?? 0;
        const [email] = await tx
          .insert(emails)
          .values({
            firmId,
            matterId: data.matterId ?? null,
            direction: data.direction,
            fromAddress: data.fromAddress,
            toAddresses: data.toAddresses,
            ccAddresses: data.ccAddresses ?? null,
            bccAddresses: data.bccAddresses ?? null,
            subject: data.subject,
            bodyText: data.bodyText ?? null,
            bodyHtml: data.bodyHtml ?? null,
            messageId: data.messageId ?? null,
            threadId: data.threadId ?? null,
            inReplyTo: data.inReplyTo ?? null,
            hasAttachments: attachmentCount > 0,
            attachmentCount,
            attachmentIds: data.attachmentIds ?? null,
            status: data.direction === "inbound" ? "received" : "draft",
            createdBy: user.user.id,
            receivedAt: data.direction === "inbound" ? new Date() : null,
          })
          .returning();

        if (email.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: email.matterId,
            type: email.direction === "inbound" ? "email_received" : "email_sent",
            title: email.direction === "inbound" ? "Email received" : "Email sent",
            actorType: "user",
            actorId: user.user.id,
            entityType: "email",
            entityId: email.id,
            occurredAt: new Date(),
            metadata: { subject: email.subject, threadId: email.threadId },
          });
        }

        return email;
      });

      return NextResponse.json(row, { status: 201 });
    })
  )
);
