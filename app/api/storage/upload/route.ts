import { NextRequest } from "next/server";
import { uploadFile, initializeBucket } from "@/lib/storage/minio";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types for upload
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const firmId = formData.get("firmId") as string | null;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!firmId) {
      return Response.json({ error: "firmId is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json({ error: `File type ${file.type} is not allowed` }, { status: 400 });
    }

    // Initialize bucket if not exists
    const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
    await initializeBucket(bucketName);

    const buffer = Buffer.from(await file.arrayBuffer());
    // Scope filename to firm for isolation
    const fileName = `${firmId}/${Date.now()}-${file.name}`;

    // Upload to MinIO
    const result = await uploadFile(bucketName, fileName, buffer, file.type);

    // Build metadata object
    const metadata: Record<string, any> = {};
    if (description) metadata.description = description;
    if (tags) metadata.tags = tags.split(",").map((t) => t.trim());

    // Save to database
    const [upload] = await db
      .insert(uploads)
      .values({
        filename: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size.toString(),
        bucket: bucketName,
        path: fileName,
        url: result.url,
      })
      .returning();

    return Response.json({
      success: true,
      upload: {
        id: upload.id,
        url: result.url,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
