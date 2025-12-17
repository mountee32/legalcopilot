import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { minioClient, uploadFile, deleteFile } from "@/lib/storage/minio";
import { eq } from "drizzle-orm";

const BUCKET_NAME = "uploads";

export async function GET() {
  try {
    const allUploads = await db.select().from(uploads).limit(20);
    return NextResponse.json({ files: allUploads });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Upload to MinIO
    const result = await uploadFile(BUCKET_NAME, filename, buffer, file.type);

    // Save to database
    const upload = await db
      .insert(uploads)
      .values({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size.toString(),
        bucket: BUCKET_NAME,
        path: filename,
        url: result.url,
        userId: null,
      })
      .returning();

    return NextResponse.json({ file: upload[0] });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Get file info from database
    const file = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);

    if (file.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from MinIO
    await deleteFile(file[0].bucket, file[0].path);

    // Delete from database
    await db.delete(uploads).where(eq(uploads.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
