// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import {
  initializeBucket,
  getPresignedUrl,
  getPresignedUploadUrl,
  downloadFile,
  deleteFile,
} from "@/lib/storage/minio";

describe("Storage Integration - Presigned URLs", () => {
  it("supports presigned upload then download", async () => {
    const bucket = `test-bucket-${randomUUID()}`;
    await initializeBucket(bucket);

    const key = `file-${randomUUID()}.txt`;
    const putUrl = await getPresignedUploadUrl(bucket, key, 60);

    const putRes = await fetch(putUrl, {
      method: "PUT",
      body: "presigned-put",
    });
    expect(putRes.ok).toBe(true);

    const getUrl = await getPresignedUrl(bucket, key, 60);
    const getRes = await fetch(getUrl);
    expect(getRes.ok).toBe(true);
    expect(await getRes.text()).toBe("presigned-put");

    const downloaded = await downloadFile(bucket, key);
    expect(downloaded.toString("utf8")).toBe("presigned-put");

    await deleteFile(bucket, key);
  });
});
