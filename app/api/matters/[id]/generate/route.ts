/**
 * POST /api/matters/[id]/generate
 *
 * Generate a document from a template using matter findings data.
 * If template contains {{AI:section}} markers, uses AI to generate narrative.
 * Creates a draft document record for human review.
 */

import { NextResponse } from "next/server";
import { eq, and, or, isNull } from "drizzle-orm";
import { templates, documents, uploads } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { GenerateDocumentSchema } from "@/lib/api/schemas/generation";
import { buildGenerationContext } from "@/lib/generation/context-builder";
import { generateDemandLetter, textToPdf } from "@/lib/generation/demand-letter";
import { renderTemplate } from "@/lib/templates/render";
import { uploadFile } from "@/lib/storage/minio";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

const AI_MARKER_REGEX = /\{\{AI:[a-zA-Z_]+\}\}/;

export const POST = withErrorHandler(
  withAuth(
    withPermission("documents:write")(async (request, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter ID required");

      const body = await request.json();
      const { templateId, overrides } = GenerateDocumentSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Load template (system or firm-owned)
        const [template] = await tx
          .select()
          .from(templates)
          .where(
            and(
              eq(templates.id, templateId),
              or(eq(templates.firmId, firmId), isNull(templates.firmId))
            )
          );

        if (!template) throw new NotFoundError("Template not found");

        // Build generation context
        const context = await buildGenerationContext(firmId, matterId, tx);

        // Merge overrides into context findings
        if (overrides) {
          Object.assign(context.findings, overrides);
        }

        let finalContent: string;
        let aiSections: string[] = [];
        let missingFields: string[] = [];
        let tokensUsed = 0;
        let aiModel: string | null = null;

        const hasAiMarkers = AI_MARKER_REGEX.test(template.content);

        if (hasAiMarkers) {
          // AI-enhanced generation
          const result = await generateDemandLetter(context, template.content);
          finalContent = result.content;
          aiSections = result.aiSections;
          missingFields = result.missing;
          tokensUsed = result.tokensUsed;
          aiModel = "anthropic/claude-3.5-sonnet";
        } else {
          // Plain template merge
          const mergeData: Record<string, unknown> = {
            matter: context.matter,
            client: context.client,
            firm: context.firm,
            feeEarner: context.feeEarner,
            findings: context.findings,
            today: context.today,
          };
          const rendered = renderTemplate(template.content, mergeData);
          finalContent = rendered.content;
          missingFields = rendered.missing;
        }

        // Convert to PDF
        const pdfBytes = await textToPdf(finalContent, context.firm.name);
        const pdfBuffer = Buffer.from(pdfBytes);

        // Generate filename
        const docId = crypto.randomUUID();
        const storagePath = `generated/${firmId}/${matterId}/${docId}.pdf`;
        const filename = `${template.name.replace(/\s+/g, "_")}_${context.matter.reference}.pdf`;

        // Upload to MinIO
        const uploadResult = await uploadFile("uploads", storagePath, pdfBuffer, "application/pdf");

        // Create upload record
        const [uploadRow] = await tx
          .insert(uploads)
          .values({
            userId: user.user.id,
            filename: storagePath,
            originalName: filename,
            mimeType: "application/pdf",
            size: String(pdfBuffer.length),
            bucket: uploadResult.bucket,
            path: storagePath,
            url: uploadResult.url,
          })
          .returning();

        // Create document record
        const [docRow] = await tx
          .insert(documents)
          .values({
            id: docId,
            firmId,
            matterId,
            title: `${template.name} — ${context.matter.reference}`,
            type: "letter_out",
            status: "draft",
            uploadId: uploadRow.id,
            filename,
            mimeType: "application/pdf",
            fileSize: pdfBuffer.length,
            createdBy: user.user.id,
            documentDate: new Date(),
            aiModel,
            aiTokensUsed: tokensUsed || null,
            metadata: {
              generatedFrom: "template",
              templateId: template.id,
              templateName: template.name,
              aiSections,
              missingMergeFields: missingFields,
              findingsUsed: Object.keys(context.findings).length,
            },
          })
          .returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId,
          type: "document_generated",
          title: `Document generated: ${template.name}`,
          description: aiSections.length
            ? `AI-enhanced document with ${aiSections.length} narrative section(s)`
            : "Template-based document generated",
          actorType: "ai",
          actorId: user.user.id,
          entityType: "document",
          entityId: docRow.id,
          occurredAt: new Date(),
          metadata: {
            templateId: template.id,
            aiSections,
            tokensUsed,
            missingFields: missingFields.length,
          },
        });

        return {
          document: {
            id: docRow.id,
            title: docRow.title,
            type: docRow.type,
            status: docRow.status,
            filename: docRow.filename,
          },
          aiSections,
          missingFields,
          tokensUsed,
        };
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
