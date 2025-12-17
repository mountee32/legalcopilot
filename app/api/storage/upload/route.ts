import { NextRequest } from "next/server";
import { uploadFile, initializeBucket } from "@/lib/storage/minio";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    // Initialize bucket if not exists
    const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
    await initializeBucket(bucketName);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to MinIO
    const result = await uploadFile(bucketName, fileName, buffer, file.type);

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
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
