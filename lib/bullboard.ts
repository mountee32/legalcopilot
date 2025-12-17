import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { emailQueue, imageQueue, jobQueue } from "@/lib/queue";

// Create Bull Board instance with all queues
export const serverAdapter = createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(imageQueue),
    new BullMQAdapter(jobQueue),
  ],
  serverAdapter: undefined, // Will be set by the adapter
});

// Export queues for easy access
export const queues = {
  email: emailQueue,
  image: imageQueue,
  jobs: jobQueue,
};

// Helper function to get queue statistics
export async function getQueueStats() {
  try {
    const emailStats = await emailQueue.getJobCounts();
    const imageStats = await imageQueue.getJobCounts();
    const jobStats = await jobQueue.getJobCounts();

    return {
      email: {
        name: "email",
        counts: emailStats,
      },
      image: {
        name: "image-processing",
        counts: imageStats,
      },
      jobs: {
        name: "jobs",
        counts: jobStats,
      },
    };
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return null;
  }
}
