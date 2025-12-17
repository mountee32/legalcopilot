import { NextRequest } from "next/server";
import { addEmailJob, addGenericJob } from "@/lib/queue";
import { z } from "zod";

const jobSchema = z.object({
  type: z.enum(["email", "generic"]),
  data: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = jobSchema.parse(body);

    let job;

    if (type === "email") {
      const emailData = z
        .object({
          to: z.string().email(),
          subject: z.string(),
          body: z.string(),
          from: z.string().email().optional(),
        })
        .parse(data);

      job = await addEmailJob(emailData);
    } else {
      job = await addGenericJob("generic-task", {
        type: "generic",
        data,
      });
    }

    return Response.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        data: job.data,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }

    console.error("Job creation error:", error);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }
}
