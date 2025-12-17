import { NextRequest, NextResponse } from "next/server";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { emailQueue, imageQueue, jobQueue } from "@/lib/queue";

// Simple in-memory adapter for Next.js
class NextServerAdapter {
  private basePath: string = "";
  private entryRoute: any;
  private statics: any;

  setBasePath(path: string) {
    this.basePath = path;
  }

  setEntryRoute(route: any) {
    this.entryRoute = route;
  }

  setStaticPath(staticsRoute: string, staticsPath: string) {
    this.statics = { route: staticsRoute, path: staticsPath };
  }

  async handler(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname.replace(this.basePath, "");

    // Serve static assets
    if (path.startsWith("/static/")) {
      const assetPath = path.replace("/static/", "");
      // Return a simple response - in production you'd serve actual static files
      return new NextResponse("Static asset", { status: 200 });
    }

    // Serve the main UI
    if (path === "" || path === "/") {
      const html = this.entryRoute?.({ basePath: this.basePath });
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Handle API calls (for Bull Board actions)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

const serverAdapter = new NextServerAdapter();
serverAdapter.setBasePath("/api/bull-board");

// Initialize Bull Board
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(imageQueue),
    new BullMQAdapter(jobQueue),
  ],
  serverAdapter: serverAdapter as any,
});

// Export route handlers
export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return serverAdapter.handler(request);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return serverAdapter.handler(request);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return serverAdapter.handler(request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return serverAdapter.handler(request);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return serverAdapter.handler(request);
}
