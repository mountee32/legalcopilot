import { NextResponse } from "next/server";

// Bull Board UI is disabled in production
// Use local development environment for queue management

export async function GET() {
  return NextResponse.json(
    {
      message: "Bull Board UI is not available in production",
      hint: "Run locally with docker-compose for queue management",
    },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}

export async function PUT() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}
