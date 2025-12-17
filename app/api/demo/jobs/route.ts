import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { addEmailJob, addImageProcessingJob, emailQueue, imageQueue } from "@/lib/queue";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allJobs = await db.select().from(jobs).limit(20);

    // Get queue stats
    const emailQueueCounts = await emailQueue.getJobCounts();
    const imageQueueCounts = await imageQueue.getJobCounts();

    return NextResponse.json({
      jobs: allJobs,
      queueStats: {
        email: emailQueueCounts,
        image: imageQueueCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json({ error: "Job type is required" }, { status: 400 });
    }

    let bullJob;

    // Create job in database
    const newJob = await db
      .insert(jobs)
      .values({
        name: type,
        data: data || {},
        status: "pending",
      })
      .returning();

    const dbJob = newJob[0];

    // Add to appropriate queue
    if (type === "email") {
      bullJob = await addEmailJob({
        to: data?.to || "test@example.com",
        subject: data?.subject || "Test Email",
        body: data?.body || "This is a test email from the demo page",
      });
    } else if (type === "image-processing") {
      bullJob = await addImageProcessingJob({
        imageUrl: data?.imageUrl || "https://example.com/image.jpg",
        operations: data?.operations || ["resize", "compress"],
      });
    } else {
      return NextResponse.json({ error: "Invalid job type" }, { status: 400 });
    }

    // Update job with Bull job ID
    if (bullJob) {
      await db
        .update(jobs)
        .set({
          data: { ...data, bullJobId: bullJob.id },
          status: "processing",
        })
        .where(eq(jobs.id, dbJob.id));
    }

    return NextResponse.json({ job: dbJob, bullJobId: bullJob?.id });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    await db.delete(jobs).where(eq(jobs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
