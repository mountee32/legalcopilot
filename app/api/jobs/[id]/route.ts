/**
 * Job Status API Endpoint
 *
 * Poll job status for background tasks like document analysis.
 *
 * GET /api/jobs/[id]
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { jobs } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { params }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Job not found");

    const [job] = await db
      .select({
        id: jobs.id,
        name: jobs.name,
        status: jobs.status,
        result: jobs.result,
        error: jobs.error,
        createdAt: jobs.createdAt,
        completedAt: jobs.completedAt,
      })
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) throw new NotFoundError("Job not found");

    return NextResponse.json({
      id: job.id,
      name: job.name,
      status: job.status,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  })
);
