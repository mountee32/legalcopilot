// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { initializeBucket, uploadFile, downloadFile, deleteFile } from "@/lib/storage/minio";

describe("Storage Integration - Upload/Download", () => {
  it("uploads and downloads a file round-trip", async () => {
    const bucket = `test-bucket-${randomUUID()}`;
    await initializeBucket(bucket);

    const key = `file-${randomUUID()}.txt`;
    const body = Buffer.from("hello-minio");
    await uploadFile(bucket, key, body, "text/plain");

    const downloaded = await downloadFile(bucket, key);
    expect(downloaded.toString("utf8")).toBe("hello-minio");

    await deleteFile(bucket, key);
  });
});
