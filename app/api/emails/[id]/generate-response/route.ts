import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { emails, matters, clients, pipelineFindings } from "@/lib/db/schema";
import { firms } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { generateEmailResponse, type ResponseContext } from "@/lib/email/response-generator";

export const POST = withErrorHandler(
  withAuth(
    withPermission("emails:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Load email
        const [email] = await tx
          .select()
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);

        if (!email) throw new NotFoundError("Email not found");

        // Load firm name
        const [firm] = await tx
          .select({ name: firms.name })
          .from(firms)
          .where(eq(firms.id, firmId))
          .limit(1);

        // Build response context
        const ctx: ResponseContext = {
          email: {
            fromAddress: email.fromAddress as { email: string; name?: string },
            subject: email.subject,
            bodyText: email.bodyText,
            aiIntent: email.aiIntent,
            aiSentiment: email.aiSentiment,
            aiUrgency: email.aiUrgency,
          },
          firmName: firm?.name || "Our Firm",
          userName: user.user.name || user.user.email,
        };

        // Load matter + client if matterId present
        if (email.matterId) {
          const [matter] = await tx
            .select({
              reference: matters.reference,
              title: matters.title,
              practiceArea: matters.practiceArea,
              status: matters.status,
              clientId: matters.clientId,
            })
            .from(matters)
            .where(and(eq(matters.id, email.matterId), eq(matters.firmId, firmId)))
            .limit(1);

          if (matter) {
            ctx.matter = {
              reference: matter.reference,
              title: matter.title,
              practiceArea: matter.practiceArea,
              status: matter.status,
            };

            if (matter.clientId) {
              const [client] = await tx
                .select({ name: clients.name, type: clients.type })
                .from(clients)
                .where(and(eq(clients.id, matter.clientId), eq(clients.firmId, firmId)))
                .limit(1);

              if (client) {
                ctx.client = { name: client.name, type: client.type };
              }
            }

            // Load recent pipeline findings
            const findings = await tx
              .select({
                label: pipelineFindings.label,
                value: pipelineFindings.value,
                confidence: pipelineFindings.confidence,
              })
              .from(pipelineFindings)
              .where(
                and(
                  eq(pipelineFindings.firmId, firmId),
                  eq(pipelineFindings.matterId, email.matterId)
                )
              )
              .orderBy(desc(pipelineFindings.confidence))
              .limit(20);

            if (findings.length > 0) {
              ctx.recentFindings = findings.map((f) => ({
                fieldLabel: f.label || "",
                extractedValue: f.value || "",
                confidence: parseFloat(String(f.confidence)) || 0,
              }));
            }
          }
        }

        // Load thread history
        if (email.threadId) {
          const threadEmails = await tx
            .select({
              direction: emails.direction,
              fromAddress: emails.fromAddress,
              subject: emails.subject,
              bodyText: emails.bodyText,
              createdAt: emails.createdAt,
            })
            .from(emails)
            .where(and(eq(emails.threadId, email.threadId), eq(emails.firmId, firmId)))
            .orderBy(emails.createdAt)
            .limit(20);

          if (threadEmails.length > 1) {
            ctx.threadHistory = threadEmails.map((e) => ({
              direction: e.direction,
              fromName: (e.fromAddress as { name?: string; email: string })?.name || "Unknown",
              subject: e.subject,
              bodyPreview: e.bodyText || "",
              createdAt: e.createdAt.toISOString(),
            }));
          }
        }

        // Generate response
        const generated = await generateEmailResponse(ctx);

        // Update email with new suggested response
        await tx
          .update(emails)
          .set({ aiSuggestedResponse: generated.response, updatedAt: new Date() })
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)));

        return generated;
      });

      return NextResponse.json({ response: result.response, tokensUsed: result.tokensUsed });
    })
  )
);
