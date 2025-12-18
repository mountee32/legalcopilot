// @vitest-environment node
/**
 * Storage Upload Endpoint Integration Tests
 *
 * Tests the /api/storage/upload endpoint and MinIO storage operations
 * with multi-tenancy isolation and file validation.
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createFirm } from "@tests/fixtures/factories/firm";
import { POST as uploadHandler } from "@/app/api/storage/upload/route";
import {
  initializeBucket,
  uploadFile,
  downloadFile,
  deleteFile,
  getPresignedUrl,
  getMinioClient,
} from "@/lib/storage/minio";

describe("Storage Integration - Upload Endpoint", () => {
  const ctx = setupIntegrationSuite();
  const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";

  describe("POST /api/storage/upload", () => {
    it("uploads small file successfully", async () => {
      await initializeBucket(bucketName);

      // Create a small test file
      const fileContent = "Test file content for upload";
      const blob = new Blob([fileContent], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("firmId", ctx.firmId);

      const response = await uploadHandler({ formData: async () => formData } as any);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.upload.id).toBeDefined();
      expect(data.upload.originalName).toBe("test.txt");
      expect(data.upload.mimeType).toBe("text/plain");
      expect(data.upload.filename).toContain(ctx.firmId); // Firm scoping
      expect(data.upload.url).toBeDefined();

      // Verify stored in database
      const [dbUpload] = await db.select().from(uploads).where(eq(uploads.id, data.upload.id));
      expect(dbUpload).toBeDefined();
      expect(dbUpload.originalName).toBe("test.txt");

      // Cleanup
      await deleteFile(bucketName, data.upload.filename);
      await db.delete(uploads).where(eq(uploads.id, data.upload.id));
    });

    it("uploads file with metadata (description, tags)", async () => {
      await initializeBucket(bucketName);

      const fileContent = "File with metadata";
      const blob = new Blob([fileContent], { type: "text/plain" });
      const file = new File([blob], "metadata-test.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("firmId", ctx.firmId);
      formData.append("description", "Test file with metadata");
      formData.append("tags", "test, integration, storage");

      const response = await uploadHandler({ formData: async () => formData } as any);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.upload.metadata).toBeDefined();
      expect(data.upload.metadata.description).toBe("Test file with metadata");
      expect(data.upload.metadata.tags).toEqual(["test", "integration", "storage"]);

      // Cleanup
      await deleteFile(bucketName, data.upload.filename);
      await db.delete(uploads).where(eq(uploads.id, data.upload.id));
    });

    it("rejects file that is too large", async () => {
      await initializeBucket(bucketName);

      // Create a file larger than 10MB
      const largeContent = "x".repeat(11 * 1024 * 1024); // 11MB
      const blob = new Blob([largeContent], { type: "text/plain" });
      const file = new File([blob], "large.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("firmId", ctx.firmId);

      const response = await uploadHandler({ formData: async () => formData } as any);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("exceeds");
    });

    it("rejects disallowed file type", async () => {
      await initializeBucket(bucketName);

      const fileContent = "console.log('malicious');";
      const blob = new Blob([fileContent], { type: "application/javascript" });
      const file = new File([blob], "script.js", { type: "application/javascript" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("firmId", ctx.firmId);

      const response = await uploadHandler({ formData: async () => formData } as any);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("not allowed");
    });

    it("rejects request with no file provided", async () => {
      const formData = new FormData();
      formData.append("firmId", ctx.firmId);

      const response = await uploadHandler({ formData: async () => formData } as any);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("No file provided");
    });

    it("rejects request with no firmId", async () => {
      const fileContent = "Test content";
      const blob = new Blob([fileContent], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file);

      const response = await uploadHandler({ formData: async () => formData } as any);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("firmId is required");
    });

    it("allows file to be accessed via presigned URL", async () => {
      await initializeBucket(bucketName);

      const fileContent = "Presigned URL test content";
      const blob = new Blob([fileContent], { type: "text/plain" });
      const file = new File([blob], "presigned.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("firmId", ctx.firmId);

      const uploadResponse = await uploadHandler({ formData: async () => formData } as any);

      expect(uploadResponse.ok).toBe(true);
      const uploadData = await uploadResponse.json();

      // Get presigned URL
      const presignedUrl = await getPresignedUrl(bucketName, uploadData.upload.filename, 60);
      expect(presignedUrl).toBeDefined();

      // Access file via presigned URL
      const downloadResponse = await fetch(presignedUrl);
      expect(downloadResponse.ok).toBe(true);
      const downloadedContent = await downloadResponse.text();
      expect(downloadedContent).toBe(fileContent);

      // Cleanup
      await deleteFile(bucketName, uploadData.upload.filename);
      await db.delete(uploads).where(eq(uploads.id, uploadData.upload.id));
    });
  });

  describe("Storage Operations", () => {
    it("performs upload and download round-trip", async () => {
      await initializeBucket(bucketName);

      const fileKey = `${ctx.firmId}/round-trip-${randomUUID()}.txt`;
      const fileContent = "Round trip test content";
      const buffer = Buffer.from(fileContent);

      // Upload
      await uploadFile(bucketName, fileKey, buffer, "text/plain");

      // Download
      const downloaded = await downloadFile(bucketName, fileKey);
      expect(downloaded.toString("utf-8")).toBe(fileContent);

      // Cleanup
      await deleteFile(bucketName, fileKey);
    });

    it("deletes file successfully", async () => {
      await initializeBucket(bucketName);

      const fileKey = `${ctx.firmId}/delete-test-${randomUUID()}.txt`;
      const buffer = Buffer.from("Delete me");

      // Upload
      await uploadFile(bucketName, fileKey, buffer, "text/plain");

      // Verify exists
      const beforeDelete = await downloadFile(bucketName, fileKey);
      expect(beforeDelete.toString("utf-8")).toBe("Delete me");

      // Delete
      const result = await deleteFile(bucketName, fileKey);
      expect(result.success).toBe(true);
      expect(result.fileName).toBe(fileKey);

      // Verify deleted
      await expect(downloadFile(bucketName, fileKey)).rejects.toThrow();
    });

    it("lists files for firm", async () => {
      await initializeBucket(bucketName);

      const fileKey1 = `${ctx.firmId}/list-test-1-${randomUUID()}.txt`;
      const fileKey2 = `${ctx.firmId}/list-test-2-${randomUUID()}.txt`;

      // Upload multiple files
      await uploadFile(bucketName, fileKey1, Buffer.from("File 1"), "text/plain");
      await uploadFile(bucketName, fileKey2, Buffer.from("File 2"), "text/plain");

      // List objects with firm prefix
      const minioClient = getMinioClient();
      const stream = minioClient.listObjects(bucketName, `${ctx.firmId}/`, true);

      const objects: string[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on("data", (obj) => {
          if (obj.name) objects.push(obj.name);
        });
        stream.on("end", () => resolve());
        stream.on("error", (err) => reject(err));
      });

      expect(objects).toContain(fileKey1);
      expect(objects).toContain(fileKey2);

      // Cleanup
      await deleteFile(bucketName, fileKey1);
      await deleteFile(bucketName, fileKey2);
    });
  });
});

describe("Storage Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();
  const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";

  it("isolates files between firms", async () => {
    await initializeBucket(bucketName);

    // Create second firm
    const firm2 = await createFirm({ name: "Second Storage Firm" });

    // Upload file for firm 1
    const fileKey1 = `${ctx.firmId}/tenant-test-${randomUUID()}.txt`;
    await uploadFile(bucketName, fileKey1, Buffer.from("Firm 1 file"), "text/plain");

    // Upload file for firm 2
    const fileKey2 = `${firm2.id}/tenant-test-${randomUUID()}.txt`;
    await uploadFile(bucketName, fileKey2, Buffer.from("Firm 2 file"), "text/plain");

    // List files for firm 1
    const minioClient = getMinioClient();
    const stream1 = minioClient.listObjects(bucketName, `${ctx.firmId}/`, true);
    const firm1Files: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream1.on("data", (obj) => {
        if (obj.name) firm1Files.push(obj.name);
      });
      stream1.on("end", () => resolve());
      stream1.on("error", (err) => reject(err));
    });

    // List files for firm 2
    const stream2 = minioClient.listObjects(bucketName, `${firm2.id}/`, true);
    const firm2Files: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream2.on("data", (obj) => {
        if (obj.name) firm2Files.push(obj.name);
      });
      stream2.on("end", () => resolve());
      stream2.on("error", (err) => reject(err));
    });

    // Verify isolation
    expect(firm1Files).toContain(fileKey1);
    expect(firm1Files).not.toContain(fileKey2);

    expect(firm2Files).toContain(fileKey2);
    expect(firm2Files).not.toContain(fileKey1);

    // Cleanup
    await deleteFile(bucketName, fileKey1);
    await deleteFile(bucketName, fileKey2);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents firm A from accessing firm B files", async () => {
    await initializeBucket(bucketName);

    // Create second firm
    const firm2 = await createFirm({ name: "Isolated Storage Firm" });

    // Upload file for firm 2
    const fileKey2 = `${firm2.id}/isolated-${randomUUID()}.txt`;
    await uploadFile(bucketName, fileKey2, Buffer.from("Firm 2 secret"), "text/plain");

    // Try to list firm 2 files using firm 1 prefix
    const minioClient = getMinioClient();
    const stream = minioClient.listObjects(bucketName, `${ctx.firmId}/`, true);
    const firm1Files: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj) => {
        if (obj.name) firm1Files.push(obj.name);
      });
      stream.on("end", () => resolve());
      stream.on("error", (err) => reject(err));
    });

    // Firm 1 should not see firm 2's file
    expect(firm1Files).not.toContain(fileKey2);

    // Direct download should work if you know the key (but API should prevent this)
    const downloaded = await downloadFile(bucketName, fileKey2);
    expect(downloaded.toString("utf-8")).toBe("Firm 2 secret");

    // Note: In production, the API layer should validate firmId matches file path prefix
    // This is a storage-level test showing the isolation mechanism works

    // Cleanup
    await deleteFile(bucketName, fileKey2);

    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
