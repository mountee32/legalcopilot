/**
 * GET /api/matters/[id]/export/findings
 *
 * Export matter findings as a downloadable PDF report.
 * Returns binary PDF directly — no database record created (transient export).
 */

import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { buildGenerationContext } from "@/lib/generation/context-builder";
import { generateFindingsReport } from "@/lib/generation/pdf-report";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter ID required");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const pdf = await withFirmDb(firmId, async (tx) => {
        const context = await buildGenerationContext(firmId, matterId, tx);
        return generateFindingsReport({ context });
      });

      const reference = `findings-${Date.now()}`;

      return new Response(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${reference}.pdf"`,
          "Content-Length": String(pdf.byteLength),
        },
      });
    })
  )
);
